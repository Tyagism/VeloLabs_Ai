import { useEffect, useState } from 'react';

/**
 * A lightweight alternative to streamlit-component-lib that works perfectly 
 * with React 19 + Vite and avoids ESM/Class Component bugs.
 */

export const Streamlit = {
  setComponentReady: () => {
    window.parent.postMessage({
      isStreamlitMessage: true,
      type: "streamlit:componentReady",
      apiVersion: 1,
    }, "*");
  },

  setFrameHeight: (height?: number) => {
    if (height === undefined) {
      const body = document.body;
      const html = document.documentElement;
      height = Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight
      );
    }
    
    window.parent.postMessage({
      isStreamlitMessage: true,
      type: "streamlit:setFrameHeight",
      height: height,
    }, "*");
  },

  setComponentValue: (value: any) => {
    window.parent.postMessage({
      isStreamlitMessage: true,
      type: "streamlit:setComponentValue",
      value: value,
    }, "*");
  }
};

export function useStreamlit() {
  const [renderData, setRenderData] = useState<{args: any, theme: any} | null>(null);
  const isStreamlit = window.parent !== window.self;

  useEffect(() => {
    if (!isStreamlit) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data.type === "streamlit:render") {
        setRenderData({
          args: event.data.args,
          theme: event.data.theme
        });
        // Auto-resize on initial render
        setTimeout(() => Streamlit.setFrameHeight(), 10);
      }
    };

    window.addEventListener("message", onMessage);
    
    // Tell Streamlit we're ready to receive messages
    Streamlit.setComponentReady();

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [isStreamlit]);

  return renderData;
}
