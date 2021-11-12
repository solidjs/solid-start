# start-vercel

Adapter for Solid apps that work on Vercel.

This is very experimental; the adapter API isn't at all fleshed out, and things will definitely change.

So far this only supports Edge functions but we intend to extend this to other output formats.

## Configuration

Need to have vercel-cli installed globally. This makes use of the File System API which is in beta and needs to be enabled via an env variable:

> ENABLE_FILE_SYSTEM_API=1
