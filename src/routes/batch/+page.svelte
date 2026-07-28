<script lang="ts">
	import Dropzone from '$lib/Dropzone.svelte';
	import ResultadoGrid from '$lib/ResultadoGrid.svelte';
	import { loteBatch, ejecutarLote } from '$lib/runner.svelte';
	import { STYLES, STYLE_KEYS } from '$lib/styleCatalog';

	let file: File | null = $state(null);

	async function generarTodos() {
		if (!file) return;
		await ejecutarLote(
			loteBatch,
			file,
			STYLE_KEYS.map((estilo) => ({
				key: estilo,
				label: STYLES[estilo].label,
				estilo,
				// Omitir el parámetro no es lo mismo que "random": el space lo trata
				// igual que mandarlo vacío, y eso cae en un color fijo (rosa) en vez
				// de variar de verdad — así que para los estilos con parámetros se
				// manda "random" explícito (verificado: sí produce variedad real).
				campos: Object.fromEntries(STYLES[estilo].params.map((p) => [p.name, 'random']))
			}))
		);
	}
</script>

<div class="batch">
	<h1>Batch tester — Buzito</h1>
	<p class="hint">Sube una foto y genérala en los {STYLE_KEYS.length} estilos con un clic.</p>

	<div class="campo">
		<span>Imagen</span>
		<Dropzone bind:file />
	</div>

	<button type="button" onclick={generarTodos} disabled={!file || loteBatch.procesando}>
		{loteBatch.procesando ? 'Generando…' : `Generar en los ${STYLE_KEYS.length} estilos`}
	</button>

	<ResultadoGrid items={loteBatch.resultados} />
</div>

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
</style>
