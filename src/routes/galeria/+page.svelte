<script lang="ts">
	import { portal } from '$lib/portal';
	import { STYLES } from '$lib/styleCatalog';

	let { data } = $props();

	let modalIndex: number | null = $state(null);
	const modalItem = $derived(modalIndex !== null ? data.generaciones[modalIndex] : null);

	function etiqueta(estilo: string) {
		return STYLES[estilo]?.label ?? estilo;
	}
	function formatearFecha(iso: string) {
		return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
	}

	function abrir(idx: number) {
		modalIndex = idx;
	}
	function cerrar() {
		modalIndex = null;
	}
	function siguiente() {
		if (modalIndex === null) return;
		modalIndex = (modalIndex + 1) % data.generaciones.length;
	}
	function anterior() {
		if (modalIndex === null) return;
		modalIndex = (modalIndex - 1 + data.generaciones.length) % data.generaciones.length;
	}
	function onWindowKeydown(e: KeyboardEvent) {
		if (modalIndex === null) return;
		if (e.key === 'Escape') {
			cerrar();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			siguiente();
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			anterior();
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="galeria">
	<h1>Galería — Buzito</h1>
	<p class="hint">
		{#if data.generaciones.length}
			{data.generaciones.length} generación{data.generaciones.length === 1 ? '' : 'es'} guardada{data.generaciones.length === 1 ? '' : 's'}.
		{:else}
			Todavía no hay nada generado.
		{/if}
	</p>

	{#if !data.generaciones.length}
		<p class="vacio">
			Ve a <a href="/">sxm tester</a> o <a href="/batch">batch tester</a> para crear tu primera imagen.
		</p>
	{:else}
		<div class="grid">
			{#each data.generaciones as g, i (g.id)}
				<div class="card">
					<button type="button" class="card-img-btn" onclick={() => abrir(i)}>
						<img src={g.cuadrado} alt={etiqueta(g.estilo)} />
					</button>
					<p class="card-label">{etiqueta(g.estilo)}</p>
					<p class="card-fecha">{formatearFecha(g.creado)}</p>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if modalItem}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
	<div class="modal-overlay" use:portal onclick={cerrar} role="button" tabindex="0">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<span>{etiqueta(modalItem.estilo)} — original</span>
				<button type="button" class="modal-close" onclick={cerrar} aria-label="Cerrar">✕</button>
			</div>
			<img src={modalItem.original} alt="{etiqueta(modalItem.estilo)} original" />
			<p class="modal-meta">
				{formatearFecha(modalItem.creado)}
				{#if Object.keys(modalItem.parametros).length}
					· {Object.entries(modalItem.parametros)
						.map(([k, v]) => `${k}: ${v}`)
						.join(', ')}
				{/if}
			</p>
			<p class="modal-instrucciones">← → para moverte · Esc para cerrar</p>
		</div>
	</div>
{/if}

<style>
	.galeria {
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
	.vacio {
		font-size: 0.95rem;
	}
	.vacio a {
		color: #fff;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1.25rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.card-img-btn {
		all: unset;
		display: block;
		width: 100%;
		cursor: zoom-in;
	}
	.card-img-btn img {
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
	.card-label {
		font-size: 0.8rem;
		opacity: 0.9;
		margin: 0;
	}
	.card-fecha {
		font-size: 0.7rem;
		opacity: 0.6;
		margin: 0;
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
		gap: 0.5rem;
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
		max-height: 75vh;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		display: block;
		object-fit: contain;
	}
	.modal-meta {
		margin: 0;
		text-align: center;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.75);
	}
	.modal-instrucciones {
		margin: 0;
		text-align: center;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.55);
	}
</style>
