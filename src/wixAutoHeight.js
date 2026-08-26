const MESSAGE_TYPE = "VITE_AUTO_HEIGHT";

function getContentHeight() {
  const root = document.getElementById("root");

  if (root) {
    return Math.ceil(
      Math.max(
        root.scrollHeight,
        root.offsetHeight,
        root.getBoundingClientRect().height
      )
    );
  }

  return Math.ceil(
    Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    )
  );
}

export function initWixAutoHeight() {
  if (
    typeof window === "undefined" ||
    window.parent === window
  ) {
    return;
  }

  let lastHeight = 0;
  let animationFrame = null;

  const timeoutIds = [];
  const trackedImages = [];

  const sendHeight = () => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
    }

    animationFrame = requestAnimationFrame(() => {
      animationFrame = null;

      const height = getContentHeight();

      if (!height) {
        return;
      }

      if (height === lastHeight) {
        return;
      }

      lastHeight = height;

      window.parent.postMessage(
        {
          type: MESSAGE_TYPE,
          height,
          pathname: window.location.pathname,
        },
        "*"
      );
    });
  };

  /*
    Initial measurements.

    WAAHL has images and asynchronously
    loaded standings/schedule data, so
    measure several times during startup.
  */
  sendHeight();

  requestAnimationFrame(sendHeight);

  [
    50,
    100,
    250,
    500,
    1000,
    1500,
    2500,
  ].forEach((delay) => {
    timeoutIds.push(
      window.setTimeout(
        sendHeight,
        delay
      )
    );
  });

  /*
    Watch the React root.

    This is especially important for
    WAAHL because standings and schedules
    change after the API request finishes.
  */
  const root =
    document.getElementById("root");

  const resizeObserver =
    new ResizeObserver(() => {
      sendHeight();
    });

  if (root) {
    resizeObserver.observe(root);
  } else {
    resizeObserver.observe(
      document.body
    );
  }

  /*
    Recalculate at responsive
    breakpoint changes.
  */
  window.addEventListener(
    "resize",
    sendHeight
  );

  window.addEventListener(
    "load",
    sendHeight
  );

  /*
    Recheck after images finish loading.
  */
  document
    .querySelectorAll("img")
    .forEach((image) => {
      if (!image.complete) {
        trackedImages.push(image);

        image.addEventListener(
          "load",
          sendHeight
        );

        image.addEventListener(
          "error",
          sendHeight
        );
      }
    });

  /*
    Recheck after web fonts settle.
  */
  if (document.fonts?.ready) {
    document.fonts.ready
      .then(sendHeight)
      .catch(() => {});
  }

  return () => {
    resizeObserver.disconnect();

    window.removeEventListener(
      "resize",
      sendHeight
    );

    window.removeEventListener(
      "load",
      sendHeight
    );

    trackedImages.forEach(
      (image) => {
        image.removeEventListener(
          "load",
          sendHeight
        );

        image.removeEventListener(
          "error",
          sendHeight
        );
      }
    );

    timeoutIds.forEach((id) => {
      window.clearTimeout(id);
    });

    if (animationFrame !== null) {
      cancelAnimationFrame(
        animationFrame
      );
    }
  };
}