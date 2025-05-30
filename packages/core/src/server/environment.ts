import { join } from 'node:path';
import { color } from '../helpers';
import type { EnvironmentContext, Rspack } from '../types';
import { run } from './runner';

export type ServerUtils = {
  readFileSync: (fileName: string) => string;
  environment: EnvironmentContext;
};

export const loadBundle = async <T>(
  stats: Rspack.Stats,
  entryName: string,
  utils: ServerUtils,
): Promise<T> => {
  const { chunks, entrypoints, outputPath } = stats.toJson({
    all: false,
    chunks: true,
    entrypoints: true,
    outputPath: true,
  });

  if (!entrypoints?.[entryName]) {
    throw new Error(
      `${color.dim('[rsbuild:loadBundle]')} Can't find entry: ${color.yellow(
        entryName,
      )}`,
    );
  }

  const { chunks: entryChunks = [] } = entrypoints[entryName];

  // find main entryChunk from chunks
  const files = entryChunks.reduce<string[]>((prev, entryChunkName) => {
    const chunk = chunks?.find(
      (chunk) => chunk.entry && chunk.names?.includes(String(entryChunkName)),
    );

    return chunk?.files
      ? prev.concat(chunk.files.filter((file) => !file.endsWith('.css')))
      : prev;
  }, []);

  if (files.length === 0) {
    throw new Error(
      `${color.dim('[rsbuild:loadBundle]')} Failed to get bundle by entryName: ${color.yellow(
        entryName,
      )}`,
    );
  }

  // An entrypoint should have only one entryChunk, but there may be some boundary cases
  if (files.length > 1) {
    throw new Error(
      `${color.dim('[rsbuild:loadBundle]')} Only support load single entry chunk, but got ${color.yellow(
        files.length,
      )}: ${files.join(',')}`,
    );
  }

  const allChunkFiles =
    chunks?.flatMap((c) => c.files).map((file) => join(outputPath!, file!)) ||
    [];

  const res = await run<T>({
    bundlePath: files[0],
    dist: outputPath!,
    compilerOptions: stats.compilation.options,
    readFileSync: utils.readFileSync,
    isBundleOutput: (modulePath: string) => allChunkFiles.includes(modulePath),
  });

  return res;
};

export const getTransformedHtml = async (
  entryName: string,
  utils: ServerUtils,
): Promise<string> => {
  const { htmlPaths, distPath } = utils.environment;
  const htmlPath = htmlPaths[entryName];

  if (!htmlPath) {
    throw new Error(
      `${color.dim('[rsbuild:getTransformedHtml]')} Failed to get HTML file by entryName: ${color.yellow(
        entryName,
      )}`,
    );
  }

  const fileName = join(distPath, htmlPath);

  const fileContent = utils.readFileSync(fileName);

  return fileContent;
};

export const createCacheableFunction = <T>(
  getter: (
    stats: Rspack.Stats,
    entryName: string,
    utils: ServerUtils,
  ) => Promise<T>,
) => {
  const cache = new WeakMap<
    Rspack.Stats,
    {
      [entryName: string]: T;
    }
  >();

  return async (
    stats: Rspack.Stats,
    entryName: string,
    utils: ServerUtils,
  ): Promise<T> => {
    const cachedEntries = cache.get(stats);
    if (cachedEntries?.[entryName]) {
      return cachedEntries[entryName];
    }

    const res = await getter(stats, entryName, utils);

    cache.set(stats, {
      ...(cachedEntries || {}),
      [entryName]: res,
    });
    return res;
  };
};
