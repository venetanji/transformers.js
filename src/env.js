/**
 * @file Module used to configure Transformers.js.
 * 
 * **Example:** Disable remote models.
 * ```javascript
 * import { env } from '@xenova/transformers';
 * env.allowRemoteModels = false;
 * ```
 * 
 * **Example:** Set local model path.
 * ```javascript
 * import { env } from '@xenova/transformers';
 * env.localModelPath = '/path/to/local/models/';
 * ```
 * 
 * **Example:** Set cache directory.
 * ```javascript
 * import { env } from '@xenova/transformers';
 * env.cacheDir = '/path/to/cache/directory/';
 * ```
 * 
 * @module env
 */

import fs from 'fs';
import path from 'path';
import url from 'url';
import { Buffer } from 'buffer';

import { ONNX } from './backends/onnx.js';
const { env: onnx_env } = ONNX;

// Check if various APIs are available (depends on environment)
const IS_REACT_NATIVE = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
const WEB_CACHE_AVAILABLE = typeof self !== 'undefined' && 'caches' in self;
const FS_AVAILABLE = !isEmpty(fs) || IS_REACT_NATIVE; // check if file system is available
const PATH_AVAILABLE = !isEmpty(path); // check if path is available

const RUNNING_LOCALLY = FS_AVAILABLE && PATH_AVAILABLE;

let __dirname = './';
if (IS_REACT_NATIVE) {
    __dirname = fs.DocumentDirectoryPath;
} else if (RUNNING_LOCALLY) {
    __dirname = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
}

// Only used for environments with access to file system
const DEFAULT_CACHE_DIR = RUNNING_LOCALLY
    ? path.join(__dirname, '/.cache/')
    : null;

// Set local model path, based on available APIs
const DEFAULT_LOCAL_MODEL_PATH = '/models/';
const localModelPath = RUNNING_LOCALLY
    ? path.join(__dirname, DEFAULT_LOCAL_MODEL_PATH)
    : DEFAULT_LOCAL_MODEL_PATH;

// Set path to wasm files. This is needed when running in a web worker.
// https://onnxruntime.ai/docs/api/js/interfaces/Env.WebAssemblyFlags.html#wasmPaths
// We use remote wasm files by default to make it easier for newer users.
// In practice, users should probably self-host the necessary .wasm files.
onnx_env.wasm.wasmPaths = RUNNING_LOCALLY
    ? path.join(__dirname, '/dist/')
    : 'https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/';


/**
 * Global variable used to control exection. This provides users a simple way to configure Transformers.js.
 * @property {Object} backends Expose environment variables of different backends,
 * allowing users to set these variables if they want to.
 * @property {boolean} allowRemoteModels Whether to allow loading of remote files, defaults to `true`.
 * If set to `false`, it will have the same effect as setting `local_files_only=true` when loading pipelines, models, tokenizers, processors, etc.
 * @property {string} remoteHost Host URL to load models from. Defaults to the Hugging Face Hub.
 * @property {string} remotePathTemplate Path template to fill in and append to `remoteHost` when loading models.
 * @property {boolean} allowLocalModels Whether to allow loading of local files, defaults to `true`.
 * If set to `false`, it will skip the local file check and try to load the model from the remote host.
 * @property {string} localModelPath Path to load local models from. Defaults to `/models/`.
 * @property {boolean} useFS Whether to use the file system to load files. By default, it is `true` if available.
 * @property {string} __dirname Directory name of module. Useful for resolving local paths.
 * @property {boolean} useBrowserCache Whether to use Cache API to cache models. By default, it is `true` if available.
 * @property {boolean} useFSCache Whether to use the file system to cache files. By default, it is `true` if available.
 * @property {string} cacheDir The directory to use for caching files with the file system. By default, it is `./.cache`.
*/
export const env = {
    /////////////////// Backends settings ///////////////////
    backends: {
        // onnxruntime-web/onnxruntime-node
        onnx: onnx_env,

        // TensorFlow.js
        tfjs: {},

        Uint8Array: IS_REACT_NATIVE ? Buffer : Uint8Array,
    },

    __dirname,

    /////////////////// Model settings ///////////////////
    allowRemoteModels: true,
    remoteHost: 'https://huggingface.co/',
    remotePathTemplate: '{model}/resolve/{revision}/',

    allowLocalModels: true,
    localModelPath: localModelPath,
    useFS: FS_AVAILABLE,

    allowFallback: !IS_REACT_NATIVE,
    useGCanvas: true,

    /////////////////// Cache settings ///////////////////
    useBrowserCache: WEB_CACHE_AVAILABLE,
    useFSCache: FS_AVAILABLE,
    cacheDir: DEFAULT_CACHE_DIR,

    //////////////////////////////////////////////////////
}


/**
 * @param {Object} obj
 * @private
 */
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

