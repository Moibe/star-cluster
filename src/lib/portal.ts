// El panel `main` del layout usa backdrop-filter, lo que crea un containing block
// nuevo para descendientes `position:fixed` (igual que transform/filter) — así que
// un overlay position:fixed anidado ahí queda atrapado dentro del panel en vez de
// cubrir el viewport real. Esta acción saca el nodo a document.body al montarlo.
export function portal(node: HTMLElement) {
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		}
	};
}
