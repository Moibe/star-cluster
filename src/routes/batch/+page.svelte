<script lang="ts">
	import { onDestroy } from 'svelte';
	import Dropzone from '$lib/Dropzone.svelte';
	import { portal } from '$lib/portal';
	import { STYLES, STYLE_KEYS } from '$lib/styleCatalog';

	const INTERVALO_MODAL_MS = 5000;

	type Estado = 'pendiente' | 'cargando' | 'ok' | 'error';
	type Resultado = {
		estilo: string;
		estado: Estado;
		cuadrado?: string;
		original?: string;
		mensaje?: string;
	};

	let file: File | null = $state(null);
	let procesando = $state(false);
	let resultados: Resultado[] = $state([]);
	let modalIndex: number | null = $state(null);
	let modalTimer: ReturnType<typeof setInterval> | undefined;

	const modalItem = $derived(modalIndex !== null ? resultados[modalIndex] : null);

	async function generarUno(estilo: string) {
		const idx = resultados.findIndex((r) => r.estilo === estilo);
		resultados[idx] = { estilo, estado: 'cargando' };

		const form = new FormData();
		form.append('image', file as File);

		try {
			const res = await fetch(`/api/generar/${estilo}`, { method: 'POST', body: form });
			const body = await res.json().catch(() => null);
			if (!res.ok) throw new Error(body?.message ?? `Error ${res.status}`);
			resultados[idx] = { estilo, estado: 'ok', cuadrado: body.cuadrado, original: body.original };
		} catch (err) {
			const mensaje =
				err instanceof TypeError
					? 'No se pudo conectar con el servidor.'
					: err instanceof Error
						? err.message
						: 'Algo falló.';
			resultados[idx] = { estilo, estado: 'error', mensaje };
		}
	}

	async function generarTodos() {
		if (!file) return;
		cerrarModal();
		procesando = true;
		resultados = STYLE_KEYS.map((estilo) => ({ estilo, estado: 'pendiente' }));

		// Secuencial a propósito: van apareciendo una por una en pantalla conforme
		// se crean, y no saturamos el space de HF con 13 llamadas concurrentes.
		for (const estilo of STYLE_KEYS) {
			await generarUno(estilo);
		}
		procesando = false;
	}

	// Busca el siguiente resultado listo ('ok') a partir de `desde`, dando la vuelta
	// al llegar al final. Si ninguno más está listo, se queda donde estaba.
	function siguienteListoIndex(desde: number): number | null {
		const n = resultados.length;
		for (let i = 1; i <= n; i++) {
			const idx = (desde + i) % n;
			if (resultados[idx].estado === 'ok') return idx;
		}
		return null;
	}

	function avanzarModal() {
		if (modalIndex === null) return;
		const siguiente = siguienteListoIndex(modalIndex);
		if (siguiente !== null) modalIndex = siguiente;
	}

	function reiniciarTimer() {
		detenerTimer();
		modalTimer = setInterval(avanzarModal, INTERVALO_MODAL_MS);
	}
	function detenerTimer() {
		clearInterval(modalTimer);
		modalTimer = undefined;
	}

	function abrirOriginal(idx: number) {
		if (resultados[idx]?.estado !== 'ok') return;
		modalIndex = idx;
		reiniciarTimer();
	}
	function cerrarModal() {
		modalIndex = null;
		detenerTimer();
	}
	function onWindowKeydown(e: KeyboardEvent) {
		if (modalIndex !== null && e.key === 'Escape') cerrarModal();
	}

	onDestroy(detenerTimer);
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="batch">
	<h1>Batch tester — Buzito</h1>
	<p class="hint">Sube una foto y genérala en los {STYLE_KEYS.length} estilos con un clic.</p>

	<div class="campo">
		<span>Imagen</span>
		<Dropzone bind:file />
	</div>

	<button type="button" onclick={generarTodos} disabled={!file || procesando}>
		{procesando ? 'Generando…' : `Generar en los ${STYLE_KEYS.length} estilos`}
	</button>

	{#if resultados.length}
		<div class="grid">
			{#each resultados as r, i (r.estilo)}
				<div class="card">
					<p class="card-label">{STYLES[r.estilo].label}</p>
					{#if r.estado === 'pendiente'}
						<div class="placeholder">En espera…</div>
					{:else if r.estado === 'cargando'}
						<div class="placeholder">
							<div class="mini-progreso"><div class="mini-progreso-barra"></div></div>
						</div>
					{:else if r.estado === 'ok'}
						<button type="button" class="card-img-btn" onclick={() => abrirOriginal(i)}>
							<img src={r.cuadrado} alt={STYLES[r.estilo].label} />
						</button>
					{:else if r.estado === 'error'}
						<div class="placeholder error-placeholder">{r.mensaje}</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if modalItem}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
	<div class="modal-overlay" use:portal onclick={cerrarModal} role="button" tabindex="0">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<span>{STYLES[modalItem.estilo].label} — original</span>
				<button type="button" class="modal-close" onclick={cerrarModal} aria-label="Cerrar">✕</button>
			</div>
			<img src={modalItem.original} alt="{STYLES[modalItem.estilo].label} original" />
		</div>
	</div>
{/if}

<style>
	.batch {
		max-width: 900px;
		margin: 0 auto;
		padding: 1.5rem 0;
	}
	h1 {
		font-size: 1.4rem;
		margin: 0 0 0.25rem;
	}
	.hint {
		opacity: 0.75;
		font-size: 0.85rem;
		margin: 0 0 1.25rem;
	}
	.campo {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
		margin-bottom: 0.9rem;
	}
	button {
		background: rgba(255, 255, 255, 0.14);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		padding: 0.6rem 1rem;
		color: #fff;
		font: inherit;
		cursor: pointer;
	}
	button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.22);
	}
	button:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.grid {
		margin-top: 1.5rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.card-label {
		font-size: 0.8rem;
		opacity: 0.8;
		margin: 0;
	}
	.card-img-btn {
		all: unset;
		display: block;
		width: 100%;
		cursor: zoom-in;
	}
	.card img {
		width: 100%;
		aspect-ratio: 1 / 1;
		object-fit: cover;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		display: block;
		transition: filter 0.15s ease;
	}
	.card-img-btn:hover img,
	.card-img-btn:focus-visible img {
		filter: brightness(1.1);
	}
	.card-img-btn:focus-visible {
		outline: 2px solid rgba(255, 255, 255, 0.8);
		outline-offset: 2px;
		border-radius: 10px;
	}
	.placeholder {
		width: 100%;
		aspect-ratio: 1 / 1;
		border-radius: 10px;
		border: 1px dashed rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.06);
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		font-size: 0.75rem;
		opacity: 0.7;
		padding: 0.5rem;
	}
	.error-placeholder {
		border-color: rgba(255, 120, 120, 0.4);
		color: #ffd3d3;
		opacity: 1;
	}
	.mini-progreso {
		width: 60%;
		height: 4px;
		border-radius: 999px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.15);
	}
	.mini-progreso-barra {
		height: 100%;
		width: 40%;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.85);
		animation: progreso-sweep 1.1s ease-in-out infinite;
	}
	@keyframes progreso-sweep {
		0% {
			transform: translateX(-150%);
		}
		100% {
			transform: translateX(350%);
		}
	}
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		z-index: 50;
		cursor: zoom-out;
	}
	.modal-content {
		max-width: min(90vw, 640px);
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		cursor: default;
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #fff;
		font-size: 0.9rem;
	}
	.modal-close {
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		width: 28px;
		height: 28px;
		color: #fff;
		cursor: pointer;
		line-height: 1;
	}
	.modal-close:hover {
		background: rgba(255, 255, 255, 0.25);
	}
	.modal-content img {
		max-width: 100%;
		max-height: 80vh;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		display: block;
		object-fit: contain;
	}
</style>
