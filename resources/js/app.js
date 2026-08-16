import '../css/app.css';

const normalizeSecret = (secret) => secret.replace(/[\s-]+/g, '').toUpperCase();

function base32ToBytes(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    const bytes = [];
    for (const char of base32.replace(/=+$/, '')) {
        const value = alphabet.indexOf(char);
        if (value === -1) throw new Error('Secret key hanya boleh berisi karakter Base32.');
        bits += value.toString(2).padStart(5, '0');
    }
    for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
    return new Uint8Array(bytes);
}

function counterToBytes(counter) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(0, Math.floor(counter / 0x100000000));
    view.setUint32(4, counter >>> 0);
    return buffer;
}

async function generateTOTP(secret) {
    const value = normalizeSecret(secret);
    if (!value) throw new Error('Masukkan secret key terlebih dahulu.');
    const bytes = base32ToBytes(value);
    if (!bytes.length) throw new Error('Secret key tidak valid.');
    const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, counterToBytes(Math.floor(Date.now() / 30000)));
    const hash = new Uint8Array(signature);
    const offset = hash.at(-1) & 0x0f;
    const binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
    return (binary % 1000000).toString().padStart(6, '0');
}

document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    const secret = $('secret');
    const result = $('resultBox');
    const empty = $('emptyState');
    const error = $('error');
    const otp = $('otp');
    const countdown = $('countdown');
    const progress = $('progressBar');
    const toast = $('toast');
    let currentOTP = '';
    let previousCounter = null;
    let toastTimer;

    const showToast = (message) => {
        toast.querySelector('span').textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
    };

    async function updateOTP() {
        const value = normalizeSecret(secret.value);
        if (!value) {
            result.classList.add('hidden'); empty.classList.remove('hidden'); error.classList.add('hidden');
            currentOTP = ''; previousCounter = null; return;
        }
        try {
            const counter = Math.floor(Date.now() / 30000);
            if (counter !== previousCounter || !currentOTP) {
                currentOTP = await generateTOTP(value);
                previousCounter = counter;
                otp.textContent = `${currentOTP.slice(0, 3)} ${currentOTP.slice(3)}`;
            }
            const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
            countdown.textContent = remaining;
            progress.style.width = `${(remaining / 30) * 100}%`;
            progress.classList.toggle('expiring', remaining <= 5);
            result.classList.remove('hidden'); empty.classList.add('hidden'); error.classList.add('hidden');
        } catch (err) {
            result.classList.add('hidden'); empty.classList.remove('hidden');
            error.querySelector('span').textContent = err.message || 'Secret key tidak valid.';
            error.classList.remove('hidden'); currentOTP = ''; previousCounter = null;
        }
    }

    secret.addEventListener('input', () => {
        const selected = groups?.find((group) => group.id === activeGroup);
        if (selected) {
            selected.secret = secret.value;
            saveGroups();
            const count = document.querySelector('.group-item.active .group-count');
            if (count) count.textContent = normalizeSecret(secret.value) ? '1' : '0';
        }
        previousCounter = null;
        updateOTP();
    });
    $('pasteSecret').addEventListener('click', async () => {
        try {
            const clipboardValue = await navigator.clipboard.readText();
            if (!clipboardValue) return;
            secret.value = clipboardValue.trim();
            const selected = groups?.find((group) => group.id === activeGroup);
            if (selected) { selected.secret = secret.value; saveGroups(); renderGroups(); }
            previousCounter = null;
            updateOTP();
            showToast('Secret key berhasil ditempel');
        } catch {
            secret.focus();
            showToast('Izinkan akses clipboard atau tempel manual');
        }
    });
    $('codeButton').addEventListener('click', async () => {
        if (!currentOTP) return;
        try { await navigator.clipboard.writeText(currentOTP); showToast('Kode berhasil disalin'); }
        catch { showToast('Gagal menyalin kode'); }
    });

    const defaultGroups = [
        { id: 'personal', name: 'Personal', color: 'lime', secret: '' },
        { id: 'work', name: 'Kantor', color: 'blue', secret: '' },
    ];
    let groups;
    try { groups = JSON.parse(localStorage.getItem('2faku-groups') || localStorage.getItem('keylime-groups')) || defaultGroups; } catch { groups = defaultGroups; }
    let activeGroup = localStorage.getItem('2faku-active-group') || localStorage.getItem('keylime-active-group') || groups[0]?.id;
    const saveGroups = () => localStorage.setItem('2faku-groups', JSON.stringify(groups));

    function renderGroups() {
        if (!groups.length) { groups = [{ id: 'personal', name: 'Personal', color: 'lime', secret: '' }]; activeGroup = groups[0].id; saveGroups(); }
        if (!groups.some((group) => group.id === activeGroup)) activeGroup = groups[0].id;
        $('groupList').innerHTML = '';
        groups.forEach((group) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `group-item${group.id === activeGroup ? ' active' : ''}`;
            button.innerHTML = `<i class="group-dot dot-${group.color}"></i><span></span><span class="group-count">${normalizeSecret(group.secret || '') ? '1' : '0'}</span>${groups.length > 1 ? '<i class="delete-group" title="Hapus grup">×</i>' : ''}`;
            button.querySelector('span').textContent = group.name;
            button.addEventListener('click', (event) => {
                if (event.target.classList.contains('delete-group')) {
                    event.stopPropagation();
                    groups = groups.filter((item) => item.id !== group.id);
                    if (activeGroup === group.id) activeGroup = groups[0]?.id;
                    saveGroups(); renderGroups(); loadGroupSecret(); showToast('Grup dihapus'); return;
                }
                activeGroup = group.id;
                localStorage.setItem('2faku-active-group', activeGroup);
                renderGroups(); loadGroupSecret();
            });
            $('groupList').appendChild(button);
        });
        const selected = groups.find((group) => group.id === activeGroup);
        $('selectedGroupLabel').textContent = `Grup: ${selected?.name || 'Personal'}`;
    }

    function loadGroupSecret() {
        const selected = groups.find((group) => group.id === activeGroup);
        secret.value = selected?.secret || '';
        previousCounter = null;
        currentOTP = '';
        updateOTP();
    }

    const modal = $('groupModal');
    const openModal = () => { modal.classList.remove('hidden'); setTimeout(() => $('groupName').focus(), 50); };
    const closeModal = () => { modal.classList.add('hidden'); $('groupForm').reset(); };
    $('openGroupModal').addEventListener('click', openModal);
    $('addGroupButton').addEventListener('click', openModal);
    $('closeGroupModal').addEventListener('click', closeModal);
    $('cancelGroup').addEventListener('click', closeModal);
    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });
    $('groupForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const name = $('groupName').value.trim();
        if (!name) return;
        const color = new FormData(event.currentTarget).get('color');
        const id = `group-${Date.now()}`;
        groups.push({ id, name, color, secret: '' }); activeGroup = id; saveGroups();
        localStorage.setItem('2faku-active-group', activeGroup); renderGroups(); closeModal(); showToast('Grup baru berhasil dibuat');
        loadGroupSecret();
    });

    const extractFacebookUid = (value) => {
        const input = value.trim();
        if (/^\d{1,20}$/.test(input)) return input;
        try {
            const url = new URL(input.includes('://') ? input : `https://${input}`);
            const queryId = url.searchParams.get('id');
            if (queryId && /^\d{1,20}$/.test(queryId)) return queryId;
            const pathId = url.pathname.split('/').filter(Boolean)[0];
            return /^\d{1,20}$/.test(pathId || '') ? pathId : null;
        } catch { return null; }
    };

    const uidInput = $('facebookUidList');
    const batchState = { live: [], dead: [], running: false, output: 'uid', runId: 0 };
    const parseUidLines = () => {
        const seen = new Set();
        return uidInput.value.split(/\r?\n/)
            .map((original) => ({ original: original.trim(), uid: extractFacebookUid(original) }))
            .filter((item) => item.uid && !seen.has(item.uid) && seen.add(item.uid));
    };
    const updateInputCount = () => {
        const validCount = parseUidLines().length;
        const totalLines = uidInput.value.split(/\r?\n/).filter((line) => line.trim()).length;
        $('copyUidInput').querySelector('span').textContent = validCount;
        if (!batchState.running) $('progressStatus').textContent = validCount
            ? `${validCount} UID ditemukan${totalLines > validCount ? ` • ${totalLines - validCount} baris non-UID diabaikan` : ''}`
            : 'Siap memeriksa';
    };
    const formatResult = (item) => batchState.output === 'original' ? item.original : (item.uid || item.original);
    const renderBatchResults = () => {
        const total = batchState.live.length + batchState.dead.length;
        $('activeStat').textContent = batchState.live.length;
        $('deadStat').textContent = batchState.dead.length;
        $('totalStat').textContent = total;
        $('activePercent').textContent = `${total ? ((batchState.live.length / total) * 100).toFixed(1) : '0'}%`;
        $('deadPercent').textContent = `${total ? ((batchState.dead.length / total) * 100).toFixed(1) : '0'}%`;
        ['live', 'dead'].forEach((type) => {
            $(`${type}Count`).textContent = batchState[type].length;
            const target = $(`${type}Results`);
            target.innerHTML = batchState[type].length ? '' : '<span class="no-result">Belum ada hasil</span>';
            batchState[type].forEach((item) => {
                const row = document.createElement('a'); row.href = item.uid ? `https://www.facebook.com/${item.uid}` : '#';
                row.target = '_blank'; row.rel = 'noopener'; row.textContent = formatResult(item); target.appendChild(row);
            });
        });
    };
    const probeUid = async (item, runId) => {
        if (!item.uid) return { item, live: false };
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 7000);
            const response = await fetch(`https://graph.facebook.com/${item.uid}/picture?type=normal&redirect=false`, {
                cache: 'no-store',
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok || runId !== batchState.runId) return { item, live: false };
            const payload = await response.json();
            const pictureUrl = payload?.data?.url || '';
            const hasProfileCdnImage = /https?:\/\/scontent[^/]*\.f(?:acebook|bcdn)\.net\//i.test(pictureUrl)
                || /https?:\/\/[^/]*fbcdn\.net\/v\//i.test(pictureUrl);
            const isStaticPlaceholder = /static[^/]*\.facebook\.com\/rsrc\.php/i.test(pictureUrl)
                || /static[^/]*\.xx\.fbcdn\.net\/rsrc\.php/i.test(pictureUrl);
            const live = payload?.data?.is_silhouette === false
                || (hasProfileCdnImage && !isStaticPlaceholder);
            return { item, live };
        } catch {
            return { item, live: false };
        }
    };
    uidInput.addEventListener('input', updateInputCount);
    $('copyUidInput').addEventListener('click', async () => { if (uidInput.value) { await navigator.clipboard.writeText(uidInput.value); showToast('Daftar UID disalin'); } });
    $('checkUidButton').addEventListener('click', async () => {
        const entries = parseUidLines();
        if (!entries.length || batchState.running) { if (!entries.length) showToast('Masukkan minimal satu UID'); return; }
        batchState.running = true; batchState.live = []; batchState.dead = []; batchState.runId += 1;
        const runId = batchState.runId; const button = $('checkUidButton'); button.disabled = true; button.innerHTML = '<span>◌</span> Checking...'; renderBatchResults();
        let completed = 0;
        const updateProgress = () => { const percent = Math.round((completed / entries.length) * 100); $('progressPercent').textContent = `${percent}%`; $('uidProgressBar').style.width = `${percent}%`; $('progressStatus').textContent = `${completed} dari ${entries.length} UID diperiksa`; };
        updateProgress();
        const workers = Array.from({ length: Math.min(10, entries.length) }, async (_, workerIndex) => {
            for (let index = workerIndex; index < entries.length; index += Math.min(10, entries.length)) {
                if (runId !== batchState.runId) return;
                const result = await probeUid(entries[index], runId); batchState[result.live ? 'live' : 'dead'].push(result.item); completed += 1; updateProgress(); renderBatchResults();
            }
        });
        await Promise.all(workers);
        if (runId === batchState.runId) { batchState.running = false; button.disabled = false; button.innerHTML = '<span>▶</span> Check'; $('progressStatus').textContent = `Selesai — ${entries.length} UID diperiksa`; }
    });
    $('resetUidButton').addEventListener('click', () => {
        batchState.runId += 1; batchState.running = false; batchState.live = []; batchState.dead = []; uidInput.value = '';
        $('checkUidButton').disabled = false; $('checkUidButton').innerHTML = '<span>▶</span> Check'; $('progressPercent').textContent = '0%'; $('uidProgressBar').style.width = '0%'; $('progressStatus').textContent = 'Siap memeriksa'; updateInputCount(); renderBatchResults();
    });
    document.querySelectorAll('[data-output]').forEach((button) => button.addEventListener('click', () => { batchState.output = button.dataset.output; document.querySelectorAll('[data-output]').forEach((item) => item.classList.toggle('active', item === button)); renderBatchResults(); }));
    document.querySelectorAll('[data-copy-result]').forEach((button) => button.addEventListener('click', async () => { const text = batchState[button.dataset.copyResult].map(formatResult).join('\n'); if (text) { await navigator.clipboard.writeText(text); showToast('Hasil disalin'); } }));
    document.querySelectorAll('[data-export-result]').forEach((button) => button.addEventListener('click', () => { const type = button.dataset.exportResult; const text = batchState[type].map(formatResult).join('\n'); if (!text) return; const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); const link = document.createElement('a'); link.href = url; link.download = `2faku-${type}-uid.txt`; link.click(); URL.revokeObjectURL(url); }));

    renderGroups(); loadGroupSecret(); setInterval(updateOTP, 1000);
});
