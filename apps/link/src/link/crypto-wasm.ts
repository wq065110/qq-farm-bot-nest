import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'

let memory: WebAssembly.Memory | null = null
let encryptRaw: ((ptr: number, len: number) => void) | null = null
let decryptRaw: ((ptr: number, len: number) => void) | null = null
let generateTokenRaw: ((ptr: number, len: number) => number) | null = null
let createBufRaw: ((size: number) => number) | null = null
let destroyBufRaw: ((ptr: number) => void) | null = null

const encoder = new TextEncoder()
const decoder = new TextDecoder()

let initPromise: Promise<void> | null = null

/**
 * 惰性加载 tsdk.wasm，初始化加密/解密导出。
 */
export function initWasm(): Promise<void> {
  if (initPromise)
    return initPromise

  initPromise = new Promise((resolve, reject) => {
    try {
      const wasmPath = path.join(__dirname, '..', 'assets', 'tsdk.wasm')
      const wasmBuffer = fs.readFileSync(wasmPath)
      const importObject = {
        a: {
          a: () => {},
          b: () => {},
          c: () => {},
          d: () => {},
          e: () => {},
          f: () => {},
          g: () => {},
          h: () => {},
          i: () => {},
          j: () => {},
          k: () => {},
          l: () => {},
          m: () => {},
          n: () => {},
          o: () => {},
          p: () => {},
          q: () => {},
          r: () => {},
          s: () => {},
          t: () => {},
          u: () => {}
        }
      }

      WebAssembly.instantiate(wasmBuffer, importObject)
        .then(({ instance }) => {
          const exports = instance.exports as Record<string, unknown>
          try {
            (exports.E as () => void)?.()
          } catch {}
          memory = exports.v as WebAssembly.Memory
          generateTokenRaw = exports._ as (ptr: number, len: number) => number
          encryptRaw = exports.J as (ptr: number, len: number) => void
          decryptRaw = exports.K as (ptr: number, len: number) => void
          createBufRaw = exports.z as (size: number) => number
          destroyBufRaw = exports.A as (ptr: number) => void
          resolve()
        })
        .catch(reject)
    } catch (e) {
      reject(e)
    }
  })
  return initPromise
}

/**
 * 生成签名 token（备用，抓包未见 URL 带签名时可用）。
 */
export async function generateToken(str: string): Promise<string> {
  if (!memory)
    await initWasm()

  const data = encoder.encode(str)
  const ptr = createBufRaw ? createBufRaw(data.length + 1) : 1024
  const memView = new Uint8Array(memory!.buffer)
  memView.set(data, ptr)
  memView[ptr + data.length] = 0

  const resPtr = generateTokenRaw!(ptr, data.length)
  let end = resPtr
  while (memView[end] !== 0 && end - resPtr < 1000)
    end++

  const outputBytes = memView.slice(resPtr, end)
  if (createBufRaw)
    destroyBufRaw!(ptr)
  return decoder.decode(outputBytes)
}

/**
 * 协议 body 加密（客户端发出前调用）。
 */
export async function encryptBuffer(buffer: Buffer): Promise<Buffer> {
  if (!memory)
    await initWasm()

  const ptr = createBufRaw!(buffer.length)
  const memView = new Uint8Array(memory!.buffer)
  memView.set(buffer, ptr)

  encryptRaw!(ptr, buffer.length)

  const output = Buffer.from(memory!.buffer as ArrayBuffer, ptr, buffer.length)
  const result = Buffer.from(output)
  destroyBufRaw!(ptr)
  return result
}

/**
 * 协议 body 解密。服务端下发的 body 为明文，一般无需调用。
 */
export async function decryptBuffer(buffer: Buffer): Promise<Buffer> {
  if (!memory)
    await initWasm()

  const ptr = createBufRaw!(buffer.length)
  const memView = new Uint8Array(memory!.buffer)
  memView.set(buffer, ptr)

  decryptRaw!(ptr, buffer.length)

  const output = Buffer.from(memory!.buffer as ArrayBuffer, ptr, buffer.length)
  const result = Buffer.from(output)
  destroyBufRaw!(ptr)
  return result
}
