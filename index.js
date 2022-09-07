"use strict";

const { compareChunksNatural } = require("webpack/lib/util/comparators");
const {
	getFullChunkName,
	getUsedChunkIds,
	assignDeterministicIds
} = require("webpack/lib/ids/IdHelpers");

/** @typedef {import("../Compiler")} Compiler */
/** @typedef {import("../Module")} Module */

class DeterministicChunkIdsPlugin {
	constructor(options) {
		this.options = options || {};
	}

	/**
	 * Apply the plugin
	 * @param {Compiler} compiler the compiler instance
	 * @returns {void}
	 */
	apply(compiler) {
		compiler.hooks.compilation.tap(
			"DeterministicChunkIdsPlugin",
			compilation => {
				compilation.hooks.chunkIds.tap(
					"DeterministicChunkIdsPlugin",
					chunks => {
						const chunkGraph = compilation.chunkGraph;
						const context = this.options.context
							? this.options.context
							: compiler.context;
						const maxLength = this.options.maxLength || 3;
						const salt = this.options.salt || 0;

						const compareNatural = compareChunksNatural(chunkGraph);

						const usedIds = getUsedChunkIds(compilation);

						assignDeterministicIds(
							Array.from(chunks).filter(chunk => {
								return chunk.id === null;
							}),
							chunk => getFullChunkName(chunk, chunkGraph, context, compiler.root),
							compareNatural,
							(chunk, id) => {
								const size = usedIds.size;
								usedIds.add(`${id}`);
								if (size === usedIds.size) return false;
								chunk.id = id;
								chunk.ids = [id];
								return true;
							},
							[Math.pow(10, maxLength)],
							10,
							usedIds.size,
							salt
						);
					}
				);
			}
		);
	}
}

module.exports = DeterministicChunkIdsPlugin;
