import '@testing-library/jest-dom/vitest';

if (!Element.prototype.animate) {
	Element.prototype.animate = () =>
		({
			cancel: () => {},
			finish: () => {},
			onfinish: null
		}) as unknown as Animation;
}
