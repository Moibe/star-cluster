<script lang="ts">
	import Dropzone from '$lib/Dropzone.svelte';
	import ResultadoGrid from '$lib/ResultadoGrid.svelte';
	import { loteParams, ejecutarLote } from '$lib/runner.svelte';
	import { STYLES, STYLE_KEYS } from '$lib/styleCatalog';

	// Solo tiene sentido probar parámetros en estilos que de hecho tienen alguno.
	const ESTILOS_CON_PARAMS = STYLE_KEYS.filter((k) => STYLES[k].params.length > 0);

	let file: File | null = $state(null);
	let estilo = $state(ESTILOS_CON_PARAMS[0]);

	const def = $derived(STYLES[estilo]);

	// Producto cartesiano de las opciones de todos los parámetros del estilo.
	function combinaciones(): Record<string, string>[] {
		return def.params.reduce<Record<string, string>[]>(
			(acc, p) => acc.flatMap((combo) => p.options.map((opt) => ({ ...combo, [p.name]: opt }))),
			[{}]
		);
	}
	function comboKey(combo: Record<string, string>) {
		return Object.values(combo).join('|');
	}
	function comboLabel(combo: Record<string, string>) {
		return def.params.map((p) => `${p.label}: ${combo[p.name]}`).join(', ');
	}

	const totalCombos = $derived(
		def.params.reduce((n, p) => n * p.options.length, 1)
	);

	async function generarTodos() {
		if (!file) return;
		const estiloActual = estilo;
		await ejecutarLote(
			loteParams,
			file,
			combinaciones().map((c) => ({
				key: comboKey(c),
				label: comboLabel(c),
				estilo: estiloActual,
				campos: c
			}))
		);
	}
</script>

<div class="params">
	<h1>Params tester — Buzito</h1>
	<p class="hint">Sube una foto, elige un estilo y genera todas sus combinaciones de parámetros.</p>

	<div class="campo">
		<span>Imagen</span>
		<Dropzone bind:file />
	</div>

	<label class="campo">
		<span>Estilo</span>
		<select bind:value={estilo}>
			{#each ESTILOS_CON_PARAMS as key (key)}
				<option value={key}>{STYLES[key].label}</option>
			{/each}
		</select>
	</label>

	<button type="button" onclick={generarTodos} disabled={!file || loteParams.procesando}>
		{loteParams.procesando ? 'Generando…' : `Generar las ${totalCombos} combinaciones`}
	</button>

	<ResultadoGrid items={loteParams.resultados} />
</div>

<style>
	.params {
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
	select {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 8px;
		padding: 0.5rem 0.6rem;
		color: #fff;
		font: inherit;
	}
	/* El popup nativo del <select> lo pinta el SO con fondo blanco pase lo que pase,
	   así que las <option> necesitan su propio color oscuro. */
	select option {
		color: #1a1a1a;
		background: #fff;
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
