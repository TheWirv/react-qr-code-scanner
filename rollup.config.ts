import type {MergedRollupOptions} from 'rollup';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import {dts} from 'rollup-plugin-dts';
import packageJson from './package.json' with {type: 'json'};

type Format = 'cjs' | 'esm';

const {warn, ...consoleWithoutWarn} = console;
const drop_console = Object.keys(
  consoleWithoutWarn
) as (keyof typeof consoleWithoutWarn)[];

function createJsConfig(format: Format, isMinified?: boolean) {
  const isEsmModule = format === 'esm';
  const outputName = `./dist/index${isMinified ? '.min' : ''}.${isEsmModule ? 'js' : 'cjs'}`;
  const ecma = isEsmModule ? 2015 : 5;

  const config: MergedRollupOptions = {
    input: packageJson.source,
    output: [
      {
        file: outputName,
        format,
        sourcemap: false,
        globals: {react: 'React'},
        exports: 'named',
      },
    ],
    plugins: [
      typescript({
        module: isEsmModule ? 'ESNext' : 'ES2015',
        target: isEsmModule ? 'ESNext' : 'ES5',
        compilerOptions: {sourceMap: false},
      }),
      ...(isMinified
        ? [
            terser({
              compress: {
                drop_console,
                ecma,
                passes: 2,
                toplevel: true,
                module: isEsmModule,
                unsafe: true,
                unsafe_arrows: isEsmModule,
                unsafe_proto: true,
                unsafe_regexp: true,
              },
              mangle: {module: isEsmModule},
              module: isEsmModule,
              format: {comments: false, ecma},
              toplevel: true,
            }),
          ]
        : []),
    ],
    external: Object.keys(packageJson.peerDependencies),
  };

  return config;
}

const dtsConfig: MergedRollupOptions = {
  input: './dist/src/index.d.ts',
  output: [{file: './dist/index.d.ts', format: 'esm'}],
  plugins: [dts()],
};

const formats: Format[] = ['cjs', 'esm'];

const configs = formats
  .map((format) => [createJsConfig(format), createJsConfig(format, true)])
  .flat();

configs.push(dtsConfig);

export default configs;
