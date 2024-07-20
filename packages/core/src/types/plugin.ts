import type RspackChain from 'rspack-chain';
import type {
  RuleSetRule,
  Configuration as WebpackConfig,
  WebpackPluginInstance,
} from 'webpack';
import type { ChainIdentifier } from '../configChain';
import type {
  ModifyRspackConfigUtils,
  NormalizedConfig,
  NormalizedEnvironmentConfig,
  RsbuildConfig,
} from './config';
import type { RsbuildContext } from './context';
import type {
  ModifyBundlerChainFn,
  ModifyChainUtils,
  ModifyEnvironmentConfigFn,
  ModifyHTMLTagsFn,
  ModifyRsbuildConfigFn,
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnAfterStartDevServerFn,
  OnAfterStartProdServerFn,
  OnBeforeBuildFn,
  OnBeforeCreateCompilerFn,
  OnBeforeStartDevServerFn,
  OnBeforeStartProdServerFn,
  OnCloseDevServerFn,
  OnDevCompileDoneFn,
  OnExitFn,
} from './hooks';
import type { RsbuildTarget } from './rsbuild';
import type { Rspack } from './rspack';
import type { RspackConfig, RspackSourceMap } from './rspack';
import type { HtmlRspackPlugin } from './thirdParty';
import type { Falsy } from './utils';
import type { MaybePromise } from './utils';

type HookOrder = 'pre' | 'post' | 'default';

export type HookDescriptor<T extends (...args: any[]) => any> = {
  handler: T;
  order: HookOrder;
};

export type AsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback | HookDescriptor<Callback>) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};

export type ModifyRspackConfigFn = (
  config: RspackConfig,
  utils: ModifyRspackConfigUtils,
) => Promise<RspackConfig | void> | RspackConfig | void;

export type ModifyWebpackChainUtils = ModifyChainUtils & {
  webpack: typeof import('webpack');
  CHAIN_ID: ChainIdentifier;
  /**
   * @deprecated Use target instead.
   * */
  name: string;
  /**
   * @deprecated Use HtmlPlugin instead.
   */
  HtmlWebpackPlugin: typeof HtmlRspackPlugin;
};

export type ModifyWebpackConfigUtils = ModifyWebpackChainUtils & {
  addRules: (rules: RuleSetRule | RuleSetRule[]) => void;
  prependPlugins: (
    plugins: WebpackPluginInstance | WebpackPluginInstance[],
  ) => void;
  appendPlugins: (
    plugins: WebpackPluginInstance | WebpackPluginInstance[],
  ) => void;
  removePlugin: (pluginName: string) => void;
  mergeConfig: typeof import('webpack-merge').merge;
};

export type ModifyWebpackChainFn = (
  chain: RspackChain,
  utils: ModifyWebpackChainUtils,
) => Promise<void> | void;

export type ModifyWebpackConfigFn = (
  config: WebpackConfig,
  utils: ModifyWebpackConfigUtils,
) => Promise<WebpackConfig | void> | WebpackConfig | void;

export type PluginManager = {
  getPlugins: () => RsbuildPlugin[];
  addPlugins: (
    plugins: Array<RsbuildPlugin | Falsy>,
    options?: { before?: string },
  ) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
  /** The plugin API. */
  pluginAPI?: RsbuildPluginAPI;
};

/**
 * The type of the Rsbuild plugin object.
 */
export type RsbuildPlugin = {
  /**
   * The name of the plugin, a unique identifier.
   */
  name: string;
  /**
   * The setup function of the plugin, which can be an async function.
   * This function is called once when the plugin is initialized.
   * @param api provides the context info, utility functions and lifecycle hooks.
   */
  setup: (api: RsbuildPluginAPI) => MaybePromise<void>;
  /**
   * Declare the names of pre-plugins, which will be executed before the current plugin.
   */
  pre?: string[];
  /**
   * Declare the names of post-plugins, which will be executed after the current plugin.
   */
  post?: string[];
  /**
   * Declare the plugins that need to be removed, you can pass an array of plugin names.
   */
  remove?: string[];
};

// Support for registering lower version Rsbuild plugins in the new version of
// Rsbuild core without throwing type mismatches. In most cases, Rsbuild core
// only adds new methods or properties to the API object, which means that lower
// version plugins will usually work fine.
type LooseRsbuildPlugin = Omit<RsbuildPlugin, 'setup'> & {
  setup: (api: any) => MaybePromise<void>;
};

export type RsbuildPlugins = (
  | LooseRsbuildPlugin
  | Falsy
  | Promise<LooseRsbuildPlugin | Falsy>
)[];

export type GetRsbuildConfig = {
  (): Readonly<RsbuildConfig>;
  (type: 'original' | 'current'): Readonly<RsbuildConfig>;
  (type: 'normalized'): NormalizedConfig;
};

type PluginHook<T extends (...args: any[]) => any> = (
  options: T | HookDescriptor<T>,
) => void;

type TransformResult =
  | string
  | {
      code: string;
      map?: string | RspackSourceMap | null;
    };

export type TransformContext = {
  /**
   * The code of the module.
   */
  code: string;
  /**
   * The absolute path of the module, including the query.
   * @example '/home/user/project/src/index.js?foo=123'
   */
  resource: string;
  /**
   * The absolute path of the module, without the query.
   * @example '/home/user/project/src/index.js'
   */
  resourcePath: string;
  /**
   * The query of the module.
   * @example '?foo=123'
   */
  resourceQuery: string;
  /**
   * Add an additional file as the dependency.
   * The file will be watched and changes to the file will trigger rebuild.
   * @param file The absolute path of the module
   */
  addDependency: (file: string) => void;
  /**
   * Emits a file to the build output.
   * @param name file name of the asset
   * @param content the source of the asset
   * @param sourceMap source map of the asset
   * @param assetInfo additional asset information
   */
  emitFile: (
    name: string,
    content: string | Buffer,
    sourceMap?: string,
    assetInfo?: Record<string, any>,
  ) => void;
};

export type TransformHandler = (
  context: TransformContext,
) => MaybePromise<TransformResult>;

export type TransformDescriptor = {
  /**
   * Include modules that match the test assertion, the same as `rule.test`
   * @see https://rspack.dev/config/module#ruletest
   */
  test?: Rspack.RuleSetCondition;
  /**
   * A condition that matches the resource query.
   * @see https://rspack.dev/config/module#ruleresourcequery
   */
  resourceQuery?: Rspack.RuleSetCondition;
  /**
   * Match based on the Rsbuild targets and only apply the transform to certain targets.
   * @see https://rsbuild.dev/config/output/targets
   */
  targets?: RsbuildTarget[];
  /**
   * Match based on the Rsbuild environment names and only apply the transform to certain environments.
   * @see https://rsbuild.dev/config/environments
   */
  environments?: string[];
  /**
   * If raw is `true`, the transform handler will receive the Buffer type code instead of the string type.
   * @see https://rspack.dev/api/loader-api/examples#raw-loader
   */
  raw?: boolean;
};

export type TransformFn = (
  descriptor: TransformDescriptor,
  handler: TransformHandler,
) => void;

export type ProcessAssetsStage =
  | 'additional'
  | 'pre-process'
  | 'derived'
  | 'additions'
  | 'none'
  | 'optimize'
  | 'optimize-count'
  | 'optimize-compatibility'
  | 'optimize-size'
  | 'dev-tooling'
  | 'optimize-inline'
  | 'summarize'
  | 'optimize-hash'
  | 'optimize-transfer'
  | 'analyse'
  | 'report';

export type ProcessAssetsDescriptor = {
  /**
   * Specifies the order in which your asset processing logic should run relative to other plugins.
   */
  stage: ProcessAssetsStage;
  /**
   * Match based on the Rsbuild targets and only process the assets of certain targets.
   * @see https://rsbuild.dev/config/output/targets
   */
  targets?: RsbuildTarget[];
};

export type ProcessAssetsHandler = (context: {
  assets: Record<string, Rspack.sources.Source>;
  compiler: Rspack.Compiler;
  compilation: Rspack.Compilation;
}) => Promise<void> | void;

export type ProcessAssetsFn = (
  descriptor: ProcessAssetsDescriptor,
  handler: ProcessAssetsHandler,
) => void;

declare function getNormalizedConfig(): NormalizedConfig;
declare function getNormalizedConfig(options: {
  environment: string;
}): NormalizedEnvironmentConfig;

/**
 * Define a generic Rsbuild plugin API that provider can extend as needed.
 */
export type RsbuildPluginAPI = Readonly<{
  context: Readonly<RsbuildContext>;
  isPluginExists: PluginManager['isPluginExists'];

  onExit: PluginHook<OnExitFn>;
  onAfterBuild: PluginHook<OnAfterBuildFn>;
  onBeforeBuild: PluginHook<OnBeforeBuildFn>;
  onCloseDevServer: PluginHook<OnCloseDevServerFn>;
  onDevCompileDone: PluginHook<OnDevCompileDoneFn>;
  onAfterStartDevServer: PluginHook<OnAfterStartDevServerFn>;
  onBeforeStartDevServer: PluginHook<OnBeforeStartDevServerFn>;
  onAfterStartProdServer: PluginHook<OnAfterStartProdServerFn>;
  onBeforeStartProdServer: PluginHook<OnBeforeStartProdServerFn>;
  onAfterCreateCompiler: PluginHook<OnAfterCreateCompilerFn>;
  onBeforeCreateCompiler: PluginHook<OnBeforeCreateCompilerFn>;

  modifyHTMLTags: PluginHook<ModifyHTMLTagsFn>;
  modifyRsbuildConfig: PluginHook<ModifyRsbuildConfigFn>;
  modifyEnvironmentConfig: PluginHook<ModifyEnvironmentConfigFn>;
  modifyBundlerChain: PluginHook<ModifyBundlerChainFn>;
  /** Only works when bundler is Rspack */
  modifyRspackConfig: PluginHook<ModifyRspackConfigFn>;
  /** Only works when bundler is Webpack */
  modifyWebpackChain: PluginHook<ModifyWebpackChainFn>;
  /** Only works when bundler is Webpack */
  modifyWebpackConfig: PluginHook<ModifyWebpackConfigFn>;

  getRsbuildConfig: GetRsbuildConfig;
  getNormalizedConfig: typeof getNormalizedConfig;

  /**
   * For plugin communication
   */
  expose: <T = any>(id: string | symbol, api: T) => void;
  useExposed: <T = any>(id: string | symbol) => T | undefined;

  /**
   * Used to transform the code of modules.
   */
  transform: TransformFn;

  /**
   * Process all the asset generated by Rspack.
   */
  processAssets: ProcessAssetsFn;
}>;
