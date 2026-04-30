"use client";

import { WebContainer } from "@webcontainer/api";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Global singleton ─────────────────────────────────────────
// WebContainer only allows ONE instance per origin.
// We cache it globally so navigating back or re-mounting the
// hook never calls .boot() twice.
let _instance: WebContainer | null = null;
let _bootPromise: Promise<WebContainer> | null = null;

function getOrBoot(): Promise<WebContainer> {
  if (_instance) return Promise.resolve(_instance);
  if (_bootPromise) return _bootPromise;

  _bootPromise = WebContainer.boot()
    .then((wc) => {
      _instance = wc;
      return wc;
    })
    .catch((err) => {
      _bootPromise = null; // allow retry
      throw err;
    });

  return _bootPromise;
}

// ── Hook ─────────────────────────────────────────────────────
export function useWebContainer() {
  const [instance, setInstance] = useState<WebContainer | null>(_instance);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [isBooting, setIsBooting] = useState(!_instance);
  const [bootError, setBootError] = useState<string | null>(null);
  const mounted = useRef(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeProcess = useRef<any>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Boot once
  useEffect(() => {
    if (_instance) {
      setInstance(_instance);
      setIsBooting(false);
      // Re-attach server-ready just in case we re-mounted
      _instance.on("server-ready", (_port, url) => {
        if (mounted.current) setPreviewUrl(url);
      });
      return;
    }

    setIsBooting(true);
    setBootError(null);

    getOrBoot()
      .then((wc) => {
        if (!mounted.current) return;
        setInstance(wc);
        wc.on("server-ready", (_port, url) => {
          if (mounted.current) setPreviewUrl(url);
        });
        setIsBooting(false);
      })
      .catch((err) => {
        if (!mounted.current) return;
        const msg = err?.message || String(err);
        setLogs((prev) => [...prev, `[ERROR] WebContainer boot failed: ${msg}`]);
        setBootError(msg);
        setIsBooting(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const retryBoot = useCallback(() => {
    // Tear down stale global state so getOrBoot() retries
    try { _instance?.teardown(); } catch { /* noop */ }
    _instance = null;
    _bootPromise = null;
    setInstance(null);
    setIsBooting(true);
    setBootError(null);

    getOrBoot()
      .then((wc) => {
        if (!mounted.current) return;
        setInstance(wc);
        wc.on("server-ready", (_port, url) => {
          if (mounted.current) setPreviewUrl(url);
        });
        setIsBooting(false);
      })
      .catch((err) => {
        if (!mounted.current) return;
        const msg = err?.message || String(err);
        setLogs((prev) => [...prev, `[ERROR] WebContainer boot failed: ${msg}`]);
        setBootError(msg);
        setIsBooting(false);
      });
  }, []);

  const writeFiles = useCallback(
    async (files: Record<string, string>) => {
      if (!instance) return;
      for (const [path, content] of Object.entries(files)) {
        const parts = path.split("/");
        if (parts.length > 1) {
          await instance.fs.mkdir(parts.slice(0, -1).join("/"), { recursive: true });
        }
        await instance.fs.writeFile(path, content);
      }
    },
    [instance]
  );

  const runCommand = useCallback(
    async (cmd: string, args: string[] = []): Promise<number> => {
      if (!instance) return 1;
      setLogs((prev) => [...prev, `\n$ ${cmd} ${args.join(" ")}`]);
      const proc = await instance.spawn(cmd, args);
      activeProcess.current = proc;
      proc.output.pipeTo(
        new WritableStream({
          write(data) {
            if (mounted.current) setLogs((prev) => [...prev, data]);
          },
        })
      );
      const code = await proc.exit;
      activeProcess.current = null;
      return code;
    },
    [instance]
  );

  const killProcess = useCallback(() => {
    if (activeProcess.current) {
      try { activeProcess.current.kill(); } catch { /* noop */ }
      activeProcess.current = null;
    }
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return {
    instance,
    previewUrl,
    logs,
    isBooting,
    bootError,
    writeFiles,
    runCommand,
    killProcess,
    clearLogs,
    retryBoot,
  };
}
