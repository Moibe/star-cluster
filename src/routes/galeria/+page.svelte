<script lang="ts">
	import { portal } from '$lib/portal';
	import { STYLES } from '$lib/styleCatalog';

	let { data } = $props();

	// La vista se agrupa por subida (foto origen), pero la navegación del modal
	// (← →) recorre todo en un solo listado plano, en el mismo orden en que se
	// muestra en pantalla.
	const itemsPlanos = $derived(data.grupos.flatMap((g) => g.items));

	let modalIndex: number | null = $state(null);
	const modalItem = $derived(modalIndex !== null ? itemsPlanos[modalIndex] : null);

	let fotoGrande: string | null = $state(null);
	function abrirFoto(url: string | null) {
		if (!url) return;
		fotoGrande = url;
	}
	function cerrarFoto() {
		fotoGrande = null;
	}

	function etiqueta(estilo: string) {
		return STYLES[estilo]?.label ?? estilo;
	}
	function formatearFecha(iso: string) {
		return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
	}

	function abrir(item: (typeof itemsPlanos)[number]) {
		modalIndex = itemsPlanos.indexOf(item);
	}
	function cerrar() {
		modalIndex = null;
	}
	function siguiente() {
		if (modalIndex === null) return;
		modalIndex = (modalIndex + 1) % itemsPlanos.length;
	}
	function anterior() {
		if (modalIndex === null) return;
		modalIndex = (modalIndex - 1 + itemsPlanos.length) % itemsPlanos.length;
	}
	function onWindowKeydown(e: KeyboardEvent) {
		if (fotoGrande !== null) {
			if (e.key === 'Escape') cerrarFoto();
			return;
		}
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
		{#if data.total}
			{data.total} generación{data.total === 1 ? '' : 'es'} guardada{data.total === 1 ? '' : 's'}, separadas por foto de origen.
		{:else}
			Todavía no hay nada generado.
		{/if}
	</p>

	{#if !data.total}
		<p class="vacio">
			Ve a <a href="/">sxm tester</a> o <a href="/batch">batch tester</a> para crear tu primera imagen.
		</p>
	{:else}
		{#each data.grupos as grupo (grupo.subidaId ?? 'sin-origen')}
			<section class="grupo">
				<div class="grupo-header">
					{#if grupo.foto}
						<button type="button" class="grupo-foto-btn" onclick={() => abrirFoto(grupo.foto)}>
							<img src={grupo.foto} alt="Foto origen" class="grupo-foto" />
						</button>
					{:else}
						<div class="grupo-foto grupo-foto-vacia" aria-hidden="true"></div>
					{/if}
					<div>
						<p class="grupo-titulo">
							{grupo.creado ? formatearFecha(grupo.creado) : 'Sin origen registrado'}
						</p>
						<p class="grupo-sub">{grupo.items.length} generación{grupo.items.length === 1 ? '' : 'es'}</p>
					</div>
				</div>
				<div class="grid">
					{#each grupo.items as g (g.id)}
						<div class="card">
							<button type="button" class="card-img-btn" onclick={() => abrir(g)}>
								<img src={g.cuadrado} alt={etiqueta(g.estilo)} />
							</button>
							<p class="card-label">{etiqueta(g.estilo)}</p>
							<p class="card-fecha">{formatearFecha(g.creado)}</p>
						</div>
					{/each}
				</div>
			</section>
		{/each}
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

{#if fotoGrande}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
	<div class="modal-overlay" use:portal onclick={cerrarFoto} role="button" tabindex="0">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<span>Foto origen</span>
				<button type="button" class="modal-close" onclick={cerrarFoto} aria-label="Cerrar">✕</button>
			</div>
			<img src={fotoGrande} alt="Foto origen" />
			<p class="modal-instrucciones">Esc para cerrar</p>
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
	.grupo {
		margin-bottom: 2rem;
	}
	.grupo-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.15);
	}
	.grupo-foto-btn {
		all: unset;
		display: block;
		cursor: zoom-in;
		flex-shrink: 0;
		border-radius: 8px;
	}
	.grupo-foto-btn:focus-visible {
		outline: 2px solid rgba(255, 255, 255, 0.8);
		outline-offset: 2px;
	}
	.grupo-foto-btn:hover .grupo-foto {
		filter: brightness(1.15);
	}
	.grupo-foto {
		width: 48px;
		height: 48px;
		object-fit: cover;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		flex-shrink: 0;
		display: block;
		transition: filter 0.15s ease;
	}
	.grupo-foto-vacia {
		background: rgba(255, 255, 255, 0.08);
		border: 1px dashed rgba(255, 255, 255, 0.25);
	}
	.grupo-titulo {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
	}
	.grupo-sub {
		margin: 0;
		font-size: 0.75rem;
		opacity: 0.65;
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
