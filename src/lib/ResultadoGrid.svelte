<script lang="ts">
	import { onDestroy } from 'svelte';
	import { portal } from '$lib/portal';

	const INTERVALO_MODAL_MS = 4000;

	export type ItemResultado = {
		key: string;
		label: string;
		estado: 'pendiente' | 'cargando' | 'ok' | 'error';
		cuadrado?: string;
		original?: string;
		mensaje?: string;
	};

	let { items }: { items: ItemResultado[] } = $props();

	let modalIndex: number | null = $state(null);
	let pausado = $state(false);
	let modalTimer: ReturnType<typeof setInterval> | undefined;

	const modalItem = $derived(modalIndex !== null ? items[modalIndex] : null);

	// Busca el siguiente/anterior resultado listo ('ok') a partir de `desde`, dando
	// la vuelta al llegar al extremo. Si ninguno más está listo, se queda donde estaba.
	function siguienteListoIndex(desde: number): number | null {
		const n = items.length;
		for (let i = 1; i <= n; i++) {
			const idx = (desde + i) % n;
			if (items[idx].estado === 'ok') return idx;
		}
		return null;
	}
	function anteriorListoIndex(desde: number): number | null {
		const n = items.length;
		for (let i = 1; i <= n; i++) {
			const idx = (desde - i + n) % n;
			if (items[idx].estado === 'ok') return idx;
		}
		return null;
	}

	function avanzarModal() {
		if (modalIndex === null) return;
		const siguiente = siguienteListoIndex(modalIndex);
		if (siguiente !== null) modalIndex = siguiente;
	}
	function navegarManual(direccion: 1 | -1) {
		if (modalIndex === null) return;
		const destino = direccion === 1 ? siguienteListoIndex(modalIndex) : anteriorListoIndex(modalIndex);
		if (destino !== null) modalIndex = destino;
		if (!pausado) reiniciarTimer();
	}
	function alternarPausa() {
		if (modalIndex === null) return;
		pausado = !pausado;
		if (pausado) detenerTimer();
		else reiniciarTimer();
	}
	function reiniciarTimer() {
		detenerTimer();
		modalTimer = setInterval(avanzarModal, INTERVALO_MODAL_MS);
	}
	function detenerTimer() {
		clearInterval(modalTimer);
		modalTimer = undefined;
	}

	function abrir(idx: number) {
		if (items[idx]?.estado !== 'ok') return;
		modalIndex = idx;
		pausado = false;
		reiniciarTimer();
	}
	function cerrar() {
		modalIndex = null;
		pausado = false;
		detenerTimer();
	}
	function onWindowKeydown(e: KeyboardEvent) {
		if (modalIndex === null) return;
		if (e.key === 'Escape') {
			cerrar();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			navegarManual(1);
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			navegarManual(-1);
		} else if (e.key === ' ' || e.key === 'Spacebar') {
			e.preventDefault();
			alternarPausa();
		}
	}

	onDestroy(detenerTimer);
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if items.length}
	<div class="grid">
		{#each items as it, i (it.key)}
			<div class="card">
				<p class="card-label">{it.label}</p>
				{#if it.estado === 'pendiente'}
					<div class="placeholder">En espera…</div>
				{:else if it.estado === 'cargando'}
					<div class="placeholder">
						<div class="mini-progreso"><div class="mini-progreso-barra"></div></div>
					</div>
				{:else if it.estado === 'ok'}
					<button type="button" class="card-img-btn" onclick={() => abrir(i)}>
						<img src={it.cuadrado} alt={it.label} />
					</button>
				{:else if it.estado === 'error'}
					<div class="placeholder error-placeholder">{it.mensaje}</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

{#if modalItem}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
	<div class="modal-overlay" use:portal onclick={cerrar} role="button" tabindex="0">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<span>{modalItem.label} — original</span>
				<button type="button" class="modal-close" onclick={cerrar} aria-label="Cerrar">✕</button>
			</div>
			<img src={modalItem.original} alt="{modalItem.label} original" />
			<p class="modal-instrucciones">
				← → para moverte · barra espaciadora para {pausado ? 'reanudar' : 'pausar'} · Esc para cerrar
				{#if pausado}<span class="pausado-tag">⏸ en pausa</span>{/if}
			</p>
		</div>
	</div>
{/if}

<style>
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
	.modal-instrucciones {
		margin: 0;
		text-align: center;
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.7);
	}
	.pausado-tag {
		margin-left: 0.5rem;
		color: #fff;
		font-weight: 600;
	}
</style>
