// This file is used to declare global types for the project.
// It is automatically included in the TypeScript compilation because it is located
// in the `app` directory, which is specified in the `tsconfig.json` file's `include` array.
declare module '*.css'

// The qrcode package ships no types. This is the one function the app uses.
declare module 'qrcode' {
    export function toDataURL(text: string, options?: { width?: number }): Promise<string>
}