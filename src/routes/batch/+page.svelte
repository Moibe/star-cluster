<script lang="ts">
	import Dropzone from '$lib/Dropzone.svelte';
	import { STYLES, STYLE_KEYS } from '$lib/styleCatalog';

	type Estado = 'pendiente' | 'cargando' | 'ok' | 'error';
	type Resultado = { estilo: string; estado: Estado; cuadrado?: string; mensaje?: string };

	let file: File | null = $state(null);
	let procesando = $state(false);
	let resultados: Resultado[] = $state([]);

	async function generarUno(estilo: string) {
		const idx = resultados.findIndex((r) => r.estilo === estilo);
		resultados[idx] = { estilo, estado: 'cargando' };

		const form = new FormData();
		form.append('image', file as File);

		try {
			const res = await fetch(`/api/generar/${estilo}`, { method: 'POST', body: form });
			const body = await res.json().catch(() => null);
			if (!res.ok) throw new Error(body?.message ?? `Error ${res.status}`);
			resultados[idx] = { estilo, estado: 'ok', cuadrado: body.cuadrado };
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
		procesando = true;
		resultados = STYLE_KEYS.map((estilo) => ({ estilo, estado: 'pendiente' }));

		// Secuencial a propósito: van apareciendo una por una en pantalla conforme
		// se crean, y no saturamos el space de HF con 13 llamadas concurrentes.
		for (const estilo of STYLE_KEYS) {
			await generarUno(estilo);
		}
		procesando = false;
	}
</script>

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
			{#each resultados as r (r.estilo)}
				<div class="card">
					<p class="card-label">{STYLES[r.estilo].label}</p>
					{#if r.estado === 'pendiente'}
						<div class="placeholder">En espera…</div>
					{:else if r.estado === 'cargando'}
						<div class="placeholder">
							<div class="mini-progreso"><div class="mini-progreso-barra"></div></div>
						</div>
					{:else if r.estado === 'ok'}
						<img src={r.cuadrado} alt={STYLES[r.estilo].label} />
					{:else if r.estado === 'error'}
						<div class="placeholder error-placeholder">{r.mensaje}</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
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
	.card img {
		width: 100%;
		aspect-ratio: 1 / 1;
		object-fit: cover;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		display: block;
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
</style>
