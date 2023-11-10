import type { DeepReadonly } from '@rsbuild/shared';
import type { NormalizedToolsConfig, ToolsConfig } from './tools';

import type {
  DevConfig,
  HtmlConfig,
  SourceConfig,
  OutputConfig,
  SecurityConfig,
  ExperimentsConfig,
  PerformanceConfig,
  NormalizedDevConfig,
  NormalizedHtmlConfig,
  NormalizedSourceConfig,
  NormalizedOutputConfig,
  NormalizedSecurityConfig,
  NormalizedExperimentsConfig,
  NormalizedPerformanceConfig,
} from '@rsbuild/shared';

export type {
  DevConfig,
  HtmlConfig,
  SourceConfig,
  OutputConfig,
  SecurityConfig,
  ExperimentsConfig,
  PerformanceConfig,
  NormalizedDevConfig,
  NormalizedHtmlConfig,
  NormalizedSourceConfig,
  NormalizedOutputConfig,
  NormalizedSecurityConfig,
  NormalizedExperimentsConfig,
  NormalizedPerformanceConfig,
};

export * from './tools';

/** The Rsbuild config when using Webpack as the bundler */
export interface RsbuildConfig {
  dev?: DevConfig;
  html?: HtmlConfig;
  tools?: ToolsConfig;
  source?: SourceConfig;
  output?: OutputConfig;
  security?: SecurityConfig;
  performance?: PerformanceConfig;
  experiments?: ExperimentsConfig;
}

export type NormalizedConfig = DeepReadonly<{
  dev: NormalizedDevConfig;
  html: NormalizedHtmlConfig;
  tools: NormalizedToolsConfig;
  source: NormalizedSourceConfig;
  output: NormalizedOutputConfig;
  security: NormalizedSecurityConfig;
  performance: NormalizedPerformanceConfig;
  experiments: NormalizedExperimentsConfig;
}>;
