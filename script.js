(function () {
  "use strict";

  const reduceMotion = matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const isTouch = matchMedia("(pointer: coarse)").matches;
  const useSmooth = finePointer && !reduceMotion;
 
  let stableViewportHeight =
    document.documentElement.clientHeight;

  let previousViewportWidth = innerWidth;

  const vh = () => stableViewportHeight;

  addEventListener(
    "resize",
    () => {
      const widthChanged =
        Math.abs(innerWidth - previousViewportWidth) > 20;
      if (!isTouch || widthChanged) {
        stableViewportHeight =
          document.documentElement.clientHeight;
      }

      previousViewportWidth = innerWidth;
    },
    { passive: true }
  );

  /* ---------- SMOOTH SCROLL ENGINE ---------- */
  const smooth = document.getElementById("smooth"),
    content = document.getElementById("page-content"),
    ghost = document.getElementById("ghost");

  let target = scrollY,
    current = scrollY,
    nativeFramePending = false;

  const mobileEffects = isTouch && !reduceMotion;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const snapToDevicePixel = (value) =>
    Math.round(value * pixelRatio) / pixelRatio;

  function setGhost() {
    ghost.style.height =
      content.offsetHeight +
      document.querySelector(".hero-spacer").offsetHeight +
      "px";
  }

  if (useSmooth) {
    document.body.classList.add("js-smooth");
    setGhost();

    if ("ResizeObserver" in window) {
      new ResizeObserver(() => {
        setGhost();
        scheduleHeroMetricsRefresh();
      }).observe(content);
    }

    addEventListener("resize", () => {
      setGhost();
      scheduleHeroMetricsRefresh();
    }, { passive: true });
  } else {
    /*
     * Touch browsers dispatch native scrolling on the compositor thread.
     * We only animate the fixed hero layer here and let the document retain
     * native momentum scrolling. A short interpolation removes uneven scroll
     * event spacing without transforming the whole page on mobile.
     */
    const runNativeFrame = () => {
      const actualY = scrollY;
      target = actualY;

      if (mobileEffects) {
        const distance = target - current;
        current += distance * 0.55;

        if (Math.abs(target - current) < 0.35) {
          current = target;
        }
      } else {
        current = target;
      }

      onScroll(current, actualY);

      if (Math.abs(target - current) > 0.35 || scrollY !== target) {
        requestAnimationFrame(runNativeFrame);
      } else {
        nativeFramePending = false;
      }
    };

    addEventListener(
      "scroll",
      () => {
        target = scrollY;

        if (!nativeFramePending) {
          nativeFramePending = true;
          requestAnimationFrame(runNativeFrame);
        }
      },
      { passive: true }
    );
  }

  /* ---------- SCROLL-DRIVEN EFFECTS ---------- */
  const heroDim = document.getElementById("hero-dim"),
    heroBg = document.getElementById("hero-bg"),
    heroInner = document.getElementById("hero-inner"),
    sealEl = document.getElementById("seal"),
    progress = document.getElementById("progress"),
    header = document.getElementById("header"),
    spacerEl = document.querySelector(".hero-spacer"),
    fcards = [...document.querySelectorAll(".fcard")];

  let lastY = scrollY;
  let heroPassed = false;
  let heroMetrics = {
    height: vh(),
    spacerHeight: 0,
    maxScroll: 1,
  };
  let metricsFramePending = false;

  function refreshHeroMetrics() {
    const height = vh();
    const spacerHeight = spacerEl.offsetHeight;
    const scrollHeight = useSmooth
      ? spacerHeight + content.offsetHeight
      : document.documentElement.scrollHeight;

    heroMetrics = {
      height,
      spacerHeight,
      maxScroll: Math.max(scrollHeight - height, 1),
    };

    metricsFramePending = false;
  }

  function scheduleHeroMetricsRefresh() {
    if (metricsFramePending) {
      return;
    }

    metricsFramePending = true;
    requestAnimationFrame(refreshHeroMetrics);
  }

  function setHeroPassed(passed) {
    if (passed === heroPassed) {
      return;
    }

    heroPassed = passed;
    document.body.classList.toggle("hero-passed", passed);
  }

  function onScroll(visualY, actualY = visualY) {
    const {
      height: h,
      spacerHeight: spH,
      maxScroll: max,
    } = heroMetrics;

    const progressValue = Math.min(
      Math.max(actualY / max, 0),
      1
    );

    progress.style.transform = `scaleX(${progressValue})`;

    const isPastHero = visualY >= spH + 2;
    setHeroPassed(isPastHero);

    /* Stop touching the hidden fixed hero once the practice section covers it. */
    if (!isPastHero) {
      const kText = Math.min(visualY / (h * 0.55), 1);
      const kDim = Math.max(
        0,
        Math.min(visualY / Math.max(spH - h, 1), 1)
      );

      heroDim.style.opacity = (kDim * 1.02).toFixed(3);

      if (!reduceMotion) {
        const heroY = snapToDevicePixel(visualY * 0.16);
        const backgroundY = snapToDevicePixel(visualY * 0.045);

        heroInner.style.transform =
          `translate3d(0, ${heroY}px, 0) scale(${1 - kText * 0.06})`;
        heroInner.style.opacity = (1 - kText * 0.92).toFixed(3);

        heroBg.style.transform =
          `translate3d(0, ${backgroundY}px, 0) scale(${1.06 + kDim * 0.07})`;

        sealEl.style.opacity = (1 - kText * 2).toFixed(2);

        for (const card of fcards) {
          const y = snapToDevicePixel(
            Number(card.dataset.start) * h -
            visualY * Number(card.dataset.speed)
          );

          card.style.transform = `translate3d(0, ${y}px, 0)`;
        }
      }
    }

    const directionDelta = actualY - lastY;

    if (
      actualY > 160 &&
      directionDelta > 4 &&
      !document.body.classList.contains("menu-open")
    ) {
      header.classList.add("hide");
    } else if (directionDelta < -4 || actualY <= 160) {
      header.classList.remove("hide");
    }

    lastY = actualY;
    teamScroll(visualY);
    spy(actualY);
  }

  /* ---------- TEAM PARALLAX (pin + card stream) ---------- */
  const teamEl = document.getElementById("team"),
    teamStage = document.getElementById("team-stage"),
    tcards = [...document.querySelectorAll(".t-card")];

  const teamMQ = matchMedia("(max-width: 900px)");

  let teamStatic = false,
    tBlur = 0,
    tPrevV = null;

  function setTeamMode() {
    teamStatic = reduceMotion || teamMQ.matches;
    teamEl.classList.toggle("team-static", teamStatic);

    if (teamStatic) {
      teamStage.style.transform = "";
      tcards.forEach((card) => {
        card.style.transform = "";
        card.style.filter = "";
      });
    }
  }

  setTeamMode();
  teamMQ.addEventListener("change", setTeamMode);

  function teamScroll(v) {
    if (teamStatic) return;

    const h = vh(),
      r = teamEl.getBoundingClientRect();

    if (r.top > h + 40 || r.bottom < -40) {
      tPrevV = v;
      tBlur = 0;
      return;
    }

    if (useSmooth) {
      /* manual pin -- sticky can't work inside the transformed scroll shell */
      const pin = Math.max(0, Math.min(-r.top, r.height - h));
      teamStage.style.transform = `translate3d(0, ${pin.toFixed(1)}px, 0)`;
    }

    const p = Math.max(0, Math.min((h - r.top) / r.height, 1));

    let blur = 0;

    if (useSmooth) {
      const dv = tPrevV == null ? 0 : v - tPrevV;
      tBlur += (Math.min(Math.abs(dv) * 0.05, 5) - tBlur) * 0.16;
      blur = tBlur > 0.3 ? tBlur : 0;
    }

    tPrevV = v;

    for (const card of tcards) {
      const y =
        ((Number(card.dataset.start) -
          Number(card.dataset.travel) * p) /
          100) *
        h;

      card.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;

      if (useSmooth) {
        card.style.filter = blur ? `blur(${blur.toFixed(2)}px)` : "";
      }
    }
  }

  /* ---------- RAF LOOP ---------- */
  function raf() {
    if (useSmooth) {
      target = scrollY;

      const distance = target - current;

      if (Math.abs(distance) > 0.05) {
        current += distance * 0.12;

        if (Math.abs(target - current) < 0.05) {
          current = target;
        }

        smooth.style.transform =
          `translate3d(0, ${-current}px, 0)`;

        onScroll(current);
      }
    }

    requestAnimationFrame(raf);
  }

  if (useSmooth) {
    current = scrollY;
    target = scrollY;

    smooth.style.transform =
      `translate3d(0, ${-current}px, 0)`;
  }

  if (useSmooth) {
    requestAnimationFrame(raf);
  }

  /* ---------- ANCHORS ---------- */
  function scrollToEl(selector) {
    if (selector === "#home") {
      window.scrollTo({
        top: 0,
        behavior: useSmooth ? "auto" : "smooth",
      });

      return;
    }

    const element = document.querySelector(selector);

    if (!element) {
      return;
    }

    const offset = selector === "#practice" ? 40 : 110;

    const baseY = useSmooth ? current : scrollY;
    const y = baseY + element.getBoundingClientRect().top - offset;

    window.scrollTo({
      top: Math.max(y, 0),
      behavior: useSmooth ? "auto" : "smooth",
    });
  }

  document.querySelectorAll("[data-anchor]").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      document.body.classList.remove("menu-open");
      scrollToEl(anchor.getAttribute("href"));
    });
  });

  /* ---------- SCROLL SPY ---------- */
  const spyLinks = document.querySelectorAll("[data-spy]");
  const spySections = ["home", "practice", "about", "faq"];
  let spyOffsets = [];

  function refreshSpyOffsets() {
    const baseY = useSmooth ? current : scrollY;

    spyOffsets = spySections
      .filter((id) => id !== "home")
      .map((id) => {
        const element = document.getElementById(id);

        return element
          ? {
              id,
              top: baseY + element.getBoundingClientRect().top,
            }
          : null;
      })
      .filter(Boolean);
  }

  function spy(v = scrollY) {
    let active = "home";
    const activationLine = v + vh() * 0.45;

    for (const section of spyOffsets) {
      if (section.top < activationLine) {
        active = section.id;
      }
    }

    spyLinks.forEach((link) => {
      link.classList.toggle(
        "active",
        link.dataset.spy === active
      );
    });
  }

  let spyViewportWidth = innerWidth;

  addEventListener("resize", () => {
    const widthChanged =
      Math.abs(innerWidth - spyViewportWidth) > 20;

    if (!isTouch || widthChanged) {
      scheduleHeroMetricsRefresh();
      requestAnimationFrame(refreshSpyOffsets);
    }

    spyViewportWidth = innerWidth;
  }, { passive: true });

  addEventListener("load", () => {
    refreshHeroMetrics();
    refreshSpyOffsets();
  }, { once: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      refreshHeroMetrics();
      refreshSpyOffsets();
    });
  }

  /* ---------- PRELOADER ---------- */
  const loader = document.getElementById("loader"),
    lFill = document.getElementById("l-fill"),
    lCount = document.getElementById("l-count");

  let p = 0,
    loaded = false;

  function finishLoad() {
    if (loaded) {
      return;
    }

    loaded = true;
    loader.classList.add("done");
    document.getElementById("home").classList.add("hero-in");
    animateHeroLetters();

    setTimeout(() => {
      loader.style.display = "none";
    }, 1000);
  }

  if (reduceMotion) {
    finishLoad();
  } else {
    const tick = setInterval(() => {
      p += Math.random() * 15 + 7;

      if (p >= 100) {
        p = 100;
        clearInterval(tick);
        setTimeout(finishLoad, 300);
      }

      lFill.style.width = p + "%";
      lCount.textContent = Math.floor(p) + "%";
    }, 100);

    setTimeout(finishLoad, 4000);
  }

  /* ---------- HERO LETTERS ---------- */
  const heroTitle = document.getElementById("hero-title");

  (function split() {
    const words = heroTitle.textContent.split(" ");
    heroTitle.textContent = "";

    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "word";

      [...word].forEach((character) => {
        const letterSpan = document.createElement("span");
        letterSpan.className = "ltr";
        letterSpan.textContent = character;
        wordSpan.appendChild(letterSpan);
      });

      heroTitle.appendChild(wordSpan);

      if (wordIndex < words.length - 1) {
        heroTitle.appendChild(document.createTextNode(" "));
      }
    });
  })();

  function animateHeroLetters() {
    if (reduceMotion) {
      return;
    }

    document
      .querySelectorAll(".hero-title .ltr")
      .forEach((element, index) => {
        element.animate(
          [
            {
              transform: "translateY(110%) rotate(6deg)",
              opacity: 0,
            },
            {
              transform: "translateY(0) rotate(0)",
              opacity: 1,
            },
          ],
          {
            duration: 950,
            delay: 150 + index * 48,
            easing: "cubic-bezier(.22,1,.36,1)",
            fill: "forwards",
          }
        );
      });
  }

  if (reduceMotion) {
    document
      .querySelectorAll(".hero-title .ltr")
      .forEach((element) => {
        element.style.transform = "none";
        element.style.opacity = "1";
      });
  }

  /* ---------- CURSOR ---------- */
  if (finePointer && !reduceMotion) {
    const dot = document.getElementById("cursor-dot"),
      ring = document.getElementById("cursor-ring"),
      halo = document.getElementById("cursor-halo");

    let mx = innerWidth / 2,
      my = innerHeight / 2,
      rx = mx,
      ry = my,
      hx = mx,
      hy = my;

    addEventListener("mousemove", (event) => {
      mx = event.clientX;
      my = event.clientY;

      dot.style.left = mx + "px";
      dot.style.top = my + "px";

      document.body.classList.add("halo-on");
    });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;

      ring.style.left = rx + "px";
      ring.style.top = ry + "px";

      hx += (mx - hx) * 0.09;
      hy += (my - hy) * 0.09;

      halo.style.transform =
        "translate3d(" + hx + "px," + hy + "px,0)";

      requestAnimationFrame(loop);
    })();

    document.addEventListener("mouseover", (event) => {
      if (
        event.target.closest(
          "a, button, select, input, textarea, label"
        )
      ) {
        document.body.classList.add("cursor-hover");
      } else {
        document.body.classList.remove("cursor-hover");
      }
    });

    document.addEventListener("mouseleave", () => {
      document.body.classList.remove("halo-on");
    });

    document.addEventListener("mouseenter", () => {
      document.body.classList.add("halo-on");
    });
  } else {
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    const halo = document.getElementById("cursor-halo");

    if (dot) {
      dot.style.display = "none";
    }

    if (ring) {
      ring.style.display = "none";
    }

    if (halo) {
      halo.style.display = "none";
    }
  }

  /* ---------- REVEALS ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  document.querySelectorAll(".reveal").forEach((element) => {
    revealObserver.observe(element);
  });

  /* ---------- PRACTICE TREE CONNECTORS ---------- */
  const treeSvg = document.getElementById("tree-svg"),
    tree = document.getElementById("tree"),
    treeHeading = document.getElementById("tree-heading");

  const cards = [...document.querySelectorAll(".p-card")];

  let paths = [],
    dots = [];

  function drawTree() {
    const mobileTree = innerWidth <= 700;

    if (innerWidth < 900 && !mobileTree) {
      treeSvg.innerHTML =
        treeSvg.innerHTML.split("</defs>")[0] + "</defs>";

      return;
    }

    const defs = treeSvg.querySelector("defs").outerHTML;
    const treeRect = tree.getBoundingClientRect();
    const headingRect = treeHeading.getBoundingClientRect();

    const hx =
      headingRect.left +
      headingRect.width / 2 -
      treeRect.left;

    const hy = headingRect.bottom - treeRect.top + 8;

    let svg = "";
    const numberOfCards = cards.length;

    cards.forEach((card, index) => {
      const tile = card.querySelector(".p-tile");
      const tileRect = tile.getBoundingClientRect();

      const cx =
        tileRect.left + tileRect.width / 2 - treeRect.left;

      const cy = tileRect.top - treeRect.top - 6;

      const radius = 14;
      const direction = cx > hx ? 1 : -1;

      const centerDistance = Math.abs(
        index - (numberOfCards - 1) / 2
      );

      /* mobile: shared centre trunk, branch out just above each icon */
      const middleY = mobileTree
        ? cy - 22
        : Math.min(
            cy - 24,
            hy +
              20 +
              ((numberOfCards - 1) / 2 - centerDistance) * 44
          );

      let pathData;

      if (Math.abs(cx - hx) < radius * 2) {
        pathData = `M ${hx} ${hy} L ${cx} ${cy}`;
      } else {
        pathData =
          `M ${hx} ${hy} ` +
          `L ${hx} ${middleY - radius} ` +
          `Q ${hx} ${middleY} ${
            hx + direction * radius
          } ${middleY} ` +
          `L ${cx - direction * radius} ${middleY} ` +
          `Q ${cx} ${middleY} ${cx} ${
            middleY + radius
          } ` +
          `L ${cx} ${cy}`;
      }

      svg += `<path d="${pathData}" data-i="${index}"/>`;
      svg += `<circle cx="${cx}" cy="${cy}" r="3" data-i="${index}"/>`;
    });

    treeSvg.innerHTML = defs + svg;

    paths = [...treeSvg.querySelectorAll("path")];
    dots = [...treeSvg.querySelectorAll("circle")];

    paths.forEach((path) => {
      const length = path.getTotalLength();

      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = treeDrawn
        ? 0
        : length;
    });

    dots.forEach((dot) => {
      dot.style.opacity = treeDrawn ? 1 : 0;
    });
  }

  let treeDrawn = false;

  function animateTree() {
    if (treeDrawn) {
      return;
    }

    treeDrawn = true;

    paths.forEach((path, index) => {
      path.animate(
        [
          {
            strokeDashoffset: path.style.strokeDashoffset,
          },
          {
            strokeDashoffset: 0,
          },
        ],
        {
          duration: 1100,
          delay: index * 130,
          easing: "cubic-bezier(.22,1,.36,1)",
          fill: "forwards",
        }
      );

      setTimeout(() => {
        path.style.strokeDashoffset = 0;
      }, 1100 + index * 130);
    });

    dots.forEach((dot, index) => {
      dot.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        {
          duration: 400,
          delay: 900 + index * 130,
          fill: "forwards",
        }
      );

      setTimeout(() => {
        dot.style.opacity = 1;
      }, 1300 + index * 130);
    });
  }

  function resetTree() {
    // rebuilding the SVG discards the old nodes along with their
    // fill:forwards animations, so a plain redraw fully re-arms the effect
    if (reduceMotion || !treeDrawn) {
      return;
    }

    treeDrawn = false;
    drawTree();
  }

  function treeInit() {
    drawTree();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(treeInit);
  } else {
    setTimeout(treeInit, 600);
  }

  let treeViewportWidth = innerWidth;

  addEventListener("resize", () => {
    const widthChanged =
      Math.abs(innerWidth - treeViewportWidth) > 20;

    if (!isTouch || widthChanged) {
      drawTree();
    }

    treeViewportWidth = innerWidth;
  }, { passive: true });

  new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1];

      if (!entry.isIntersecting) {
        resetTree(); // fully out of view: replay on the next visit
        return;
      }

      if (entry.intersectionRatio < 0.25) {
        return; // partially visible: neither replay nor reset
      }

      drawTree();

      if (!reduceMotion) {
        animateTree();
      } else {
        treeDrawn = true;
        drawTree();
      }
    },
    { threshold: [0, 0.25] }
  ).observe(tree);

  /* ---------- STAT COUNTERS ---------- */
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        const suffix = element.dataset.suffix || "";

        if (!entry.isIntersecting) {
          if (reduceMotion || !element._statPlayed) {
            return;
          }

          // fully out of view: stop any running count and arm a replay
          element._statRun = (element._statRun || 0) + 1;
          element._statPlayed = false;
          element.textContent = "0" + suffix;
          return;
        }

        if (entry.intersectionRatio < 0.6 || element._statPlayed) {
          return;
        }

        element._statPlayed = true;
        const targetValue = Number(element.dataset.count);

        if (reduceMotion) {
          element.textContent = targetValue + suffix;
          return;
        }

        const duration = 1800;
        const startTime = performance.now();
        const run = (element._statRun = (element._statRun || 0) + 1);

        function step(time) {
          if (element._statRun !== run) {
            return; // superseded by a reset while off-screen
          }

          const progressValue = Math.min(
            (time - startTime) / duration,
            1
          );

          const eased =
            1 - Math.pow(1 - progressValue, 4);

          element.textContent =
            Math.floor(eased * targetValue) + suffix;

          if (progressValue < 1) {
            requestAnimationFrame(step);
          }
        }

        step(startTime);
      });
    },
    { threshold: [0, 0.6] }
  );

  document.querySelectorAll("[data-count]").forEach((element) => {
    statObserver.observe(element);
  });

  /* ---------- ABOUT TILT ---------- */
  if (finePointer && !reduceMotion) {
    const card = document.getElementById("tilt-card");
    const frame = document.getElementById("about-frame");

    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();

      const x =
        (event.clientX - rect.left) / rect.width - 0.5;

      const y =
        (event.clientY - rect.top) / rect.height - 0.5;

      frame.style.transform = `rotateY(${
        x * 10
      }deg) rotateX(${-y * 10}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      frame.style.transition =
        "transform .8s cubic-bezier(.22,1,.36,1)";

      frame.style.transform = "";

      setTimeout(() => {
        frame.style.transition =
          "transform .2s linear";
      }, 800);
    });
  }

  /* ---------- TEAM CARD TILT ---------- */
  if (finePointer && !reduceMotion) {
    tcards.forEach((card) => {
      const frame = card.querySelector(".t-frame");

      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();

        const x =
          (event.clientX - rect.left) / rect.width - 0.5;

        const y =
          (event.clientY - rect.top) / rect.height - 0.5;

        frame.style.transform = `perspective(900px) rotateY(${
          x * 10
        }deg) rotateX(${-y * 10}deg)`;
      });

      card.addEventListener("mouseleave", () => {
        frame.style.transition =
          "transform .8s cubic-bezier(.22,1,.36,1)";

        frame.style.transform = "";

        setTimeout(() => {
          frame.style.transition = "transform .2s linear";
        }, 800);
      });
    });
  }

  /* ---------- TEAM MEMBER PROFILE ---------- */
  const member = document.getElementById("member");

  if (member && tcards.length) {
    const shell = member.querySelector(".mem-shell"),
      flyer = document.getElementById("mem-flyer"),
      photoSlot = document.getElementById("mem-photo"),
      tagsEl = document.getElementById("mem-tags"),
      firstEl = document.getElementById("mem-first"),
      lastEl = document.getElementById("mem-last"),
      bioEl = document.getElementById("mem-bio"),
      statsEl = document.getElementById("mem-stats"),
      memClose = document.getElementById("mem-close");

    let openCard = null,
      flying = false,
      landTimer = 0;

    tcards.forEach((card) => {
      card.setAttribute("role", "button");
      card.setAttribute("aria-haspopup", "dialog");
      card.tabIndex = 0;

      const name = card
        .querySelector("figcaption b")
        .textContent.trim();

      card.setAttribute(
        "aria-label",
        "View the profile of " + name
      );

      const view = document.createElement("span");
      view.className = "t-view";
      view.setAttribute("aria-hidden", "true");
      view.innerHTML =
        '<i><svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg></i>';
      card.querySelector(".t-frame").appendChild(view);

      card.addEventListener("click", () => openMember(card));

      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openMember(card);
        }
      });
    });

    function fillProfile(card) {
      const name = card
        .querySelector("figcaption b")
        .textContent.trim();

      const role = card
        .querySelector("figcaption span")
        .textContent.trim();

      const parts = name.split(/\s+/);
      firstEl.textContent = parts.shift();
      lastEl.textContent = parts.join(" ");

      tagsEl.textContent = "";

      (card.dataset.tags || role).split(",").forEach((tag) => {
        const chip = document.createElement("span");
        chip.textContent = tag.trim();
        tagsEl.appendChild(chip);
      });

      bioEl.textContent = card.dataset.bio || "";
      statsEl.textContent = "";

      (card.dataset.stats || "").split(";").forEach((pair) => {
        if (!pair.trim()) {
          return;
        }

        const [num, label] = pair.split("|");
        const stat = document.createElement("div");
        stat.className = "mem-stat";

        const b = document.createElement("b");
        b.textContent = (num || "").trim();

        const s = document.createElement("span");
        s.textContent = (label || "").trim();

        stat.append(b, s);
        statsEl.appendChild(stat);
      });
    }

    /* clone of a card frame, its type scaled by k so the whole tile
       grows as one piece while it flies to the k-times-larger slot */
    function frameClone(card, k) {
      const src = card.querySelector(".t-frame");
      const clone = src.cloneNode(true);

      const view = clone.querySelector(".t-view");

      if (view) {
        view.remove();
      }

      clone.style.transform = "none";
      clone.style.transition = "none";

      const mono = clone.querySelector(".t-mono");

      if (mono) {
        mono.style.fontSize =
          parseFloat(
            getComputedStyle(src.querySelector(".t-mono"))
              .fontSize
          ) *
            k +
          "px";
      }

      const est = clone.querySelector(".t-est");

      if (est) {
        est.style.fontSize =
          parseFloat(
            getComputedStyle(src.querySelector(".t-est"))
              .fontSize
          ) *
            k +
          "px";

        est.style.bottom = 20 * k + "px";
      }

      clone.style.setProperty("--fin", 12 * k + "px");
      return clone;
    }

    function openMember(card) {
      if (flying || member.classList.contains("show")) {
        return;
      }

      openCard = card;
      fillProfile(card);

      /* the tilt effect may have the frame mid-rotation -- settle it
         so the measured rect matches what the flyer will show */
      const srcFrame = card.querySelector(".t-frame");
      srcFrame.style.transition = "none";
      srcFrame.style.transform = "none";

      document.documentElement.classList.add("mem-lock");
      member.classList.add("show");
      shell.scrollTop = 0;

      const srcRect = srcFrame.getBoundingClientRect();
      const dstRect = photoSlot.getBoundingClientRect();
      const k = dstRect.width / srcRect.width;
      const clone = frameClone(card, k);

      if (reduceMotion) {
        photoSlot.appendChild(clone);
        member.classList.add("in");
        memClose.focus({ preventScroll: true });
        return;
      }

      flying = true;
      flyer.style.left = dstRect.left + "px";
      flyer.style.top = dstRect.top + "px";
      flyer.style.width = dstRect.width + "px";
      flyer.style.height = dstRect.height + "px";
      flyer.style.transition = "none";

      flyer.style.transform = `translate(${
        srcRect.left - dstRect.left
      }px, ${srcRect.top - dstRect.top}px) scale(${
        srcRect.width / dstRect.width
      }, ${srcRect.height / dstRect.height})`;

      flyer.style.opacity = "1";
      flyer.appendChild(clone);
      flyer.getBoundingClientRect();

      flyer.style.transition = "transform .75s var(--ease)";
      flyer.style.transform = "translate(0px, 0px) scale(1, 1)";

      member.classList.add("in");
      memClose.focus({ preventScroll: true });

      clearTimeout(landTimer);

      landTimer = setTimeout(() => {
        photoSlot.appendChild(clone);
        flyer.style.transition = "none";
        flyer.style.opacity = "0";
        flying = false;
      }, 780);
    }

    function closeMember() {
      if (!member.classList.contains("show") || flying) {
        return;
      }

      const clone = photoSlot.querySelector(".t-frame");
      member.classList.remove("in");

      const finish = () => {
        member.classList.remove("show");
        document.documentElement.classList.remove("mem-lock");
        flyer.textContent = "";
        photoSlot.textContent = "";
        flyer.style.opacity = "0";

        if (openCard) {
          openCard.focus({ preventScroll: true });
        }

        openCard = null;
      };

      if (reduceMotion || !clone || !openCard) {
        finish();
        return;
      }

      flying = true;

      const srcRect = photoSlot.getBoundingClientRect();

      const dstRect = openCard
        .querySelector(".t-frame")
        .getBoundingClientRect();

      flyer.style.left = srcRect.left + "px";
      flyer.style.top = srcRect.top + "px";
      flyer.style.width = srcRect.width + "px";
      flyer.style.height = srcRect.height + "px";
      flyer.style.transition = "none";
      flyer.style.transform = "translate(0px, 0px) scale(1, 1)";
      flyer.style.opacity = "1";
      flyer.appendChild(clone);
      flyer.getBoundingClientRect();

      flyer.style.transition =
        "transform .65s var(--ease), opacity .22s linear .5s";

      flyer.style.transform = `translate(${
        dstRect.left - srcRect.left
      }px, ${dstRect.top - srcRect.top}px) scale(${
        dstRect.width / srcRect.width
      }, ${dstRect.height / srcRect.height})`;

      flyer.style.opacity = "0";

      clearTimeout(landTimer);

      landTimer = setTimeout(() => {
        flying = false;
        finish();
      }, 730);
    }

    memClose.addEventListener("click", () => closeMember());

    /* a click on the empty space around the profile closes it */
    shell.addEventListener("mousedown", (event) => {
      if (event.target === shell) {
        closeMember();
      }
    });

    addEventListener("keydown", (event) => {
      if (!member.classList.contains("show")) {
        return;
      }

      if (event.key === "Escape") {
        closeMember();
        return;
      }

      if (event.key === "Tab") {
        /* the close button is the dialog's only control */
        event.preventDefault();
        memClose.focus();
      }
    });
  }

  /* ---------- FAQ ---------- */
  document.querySelectorAll(".faq").forEach((item) => {
    const question = item.querySelector(".faq-q");
    const answer = item.querySelector(".faq-a");

    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      document
        .querySelectorAll(".faq.open")
        .forEach((openItem) => {
          openItem.classList.remove("open");

          openItem.querySelector(
            ".faq-a"
          ).style.maxHeight = null;

          openItem
            .querySelector(".faq-q")
            .setAttribute("aria-expanded", "false");
        });

      if (!isOpen) {
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
        question.setAttribute("aria-expanded", "true");
      }

      setTimeout(setGhostSafe, 650);
    });
  });

  function setGhostSafe() {
    if (useSmooth) {
      setGhost();
    }
  }

  /* ---------- MOBILE MENU ---------- */
  const hamburger = document.getElementById("hamburger");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      document.body.classList.toggle("menu-open");
    });
  }

  /* ---------- SELECT / FORM ---------- */
  const serviceSelect = document.getElementById("f-service");
  const serviceField = document.getElementById("service-field");
  const form = document.getElementById("book-form");
  const success = document.getElementById("success");
  const successClose = document.getElementById("success-close");

  let serviceFlashEl = serviceSelect;
  let resetServiceUI = () => {};

  if (serviceSelect && serviceField) {
    serviceSelect.addEventListener("change", () => {
      serviceField.classList.toggle(
        "filled",
        Boolean(serviceSelect.value)
      );
    });

    /* Custom themed dropdown, built over the native select (which stays
       hidden as the form's source of truth; no JS = native select). */
    const options = [...serviceSelect.options].filter(
      (option) => option.value
    );

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.id = "service-trigger";
    trigger.className = "select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", "service-menu");

    const valueEl = document.createElement("span");
    valueEl.className = "select-value";
    valueEl.id = "service-value";
    trigger.appendChild(valueEl);
    trigger.insertAdjacentHTML(
      "beforeend",
      '<svg class="select-caret" viewBox="0 0 14 9" aria-hidden="true"><path d="M1.5 1.5 7 7.5 12.5 1.5"/></svg>'
    );

    const svcLabel = serviceField.querySelector("label");

    if (svcLabel) {
      svcLabel.id = svcLabel.id || "service-label";
      trigger.setAttribute(
        "aria-labelledby",
        svcLabel.id + " service-value"
      );
    }

    const menu = document.createElement("ul");
    menu.id = "service-menu";
    menu.className = "select-menu";
    menu.setAttribute("role", "listbox");

    const items = options.map((option, index) => {
      const li = document.createElement("li");

      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.tabIndex = -1;
      li.textContent = option.value;
      li.style.setProperty("--d", index * 45 + "ms"); // entrance stagger

      li.addEventListener("click", () => {
        choose(index);
        trigger.focus();
      });

      li.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose(index);
          trigger.focus();
        }
      });

      menu.appendChild(li);
      return li;
    });

    serviceSelect.after(trigger);
    serviceField.appendChild(menu);
    serviceField.classList.add("has-custom");
    serviceSelect.tabIndex = -1;
    serviceSelect.setAttribute("aria-hidden", "true");
    serviceFlashEl = trigger;

    const isOpen = () => serviceField.classList.contains("open");

    function open() {
      serviceField.classList.add("open");
      menu.style.maxHeight = menu.scrollHeight + "px";
      trigger.setAttribute("aria-expanded", "true");
    }

    function close() {
      serviceField.classList.remove("open");
      menu.style.maxHeight = "0px";
      trigger.setAttribute("aria-expanded", "false");
    }

    function choose(index) {
      serviceSelect.value = options[index].value;
      serviceSelect.dispatchEvent(new Event("change"));
      valueEl.textContent = options[index].value;

      items.forEach((li, i) => {
        li.setAttribute(
          "aria-selected",
          i === index ? "true" : "false"
        );
      });

      close();
    }

    resetServiceUI = () => {
      valueEl.textContent = "";

      items.forEach((li) => {
        li.setAttribute("aria-selected", "false");
      });

      close();
    };

    trigger.addEventListener("click", () => {
      isOpen() ? close() : open();
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }

      event.preventDefault();

      if (!isOpen()) {
        open();
      }

      const selected = items.findIndex(
        (li) => li.getAttribute("aria-selected") === "true"
      );

      const fallback =
        event.key === "ArrowDown" ? 0 : items.length - 1;

      items[selected < 0 ? fallback : selected].focus();
    });

    menu.addEventListener("keydown", (event) => {
      const index = items.indexOf(document.activeElement);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        items[Math.min(index + 1, items.length - 1)].focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        items[Math.max(index - 1, 0)].focus();
      }
    });

    addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        close();
        trigger.focus();
      }
    });

    addEventListener("pointerdown", (event) => {
      if (isOpen() && !serviceField.contains(event.target)) {
        close();
      }
    });
  }

  if (form && success && serviceSelect) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = document.getElementById("f-name");
      const email = document.getElementById("f-email");

      let valid = true;

      [
        [name, name],
        [email, email],
        [serviceSelect, serviceFlashEl], // the native select is hidden; flash its trigger
      ].forEach(([field, flashEl]) => {
        if (!field || field.value) {
          return;
        }

        valid = false;
        flashEl.style.borderBottomColor = "#b3452f";

        setTimeout(() => {
          flashEl.style.borderBottomColor = "";
        }, 1800);
      });

      if (!valid) {
        return;
      }

      success.classList.add("show");
      form.reset();
      resetServiceUI();

      if (serviceField) {
        serviceField.classList.remove("filled");
      }
    });
  }

  if (successClose && success) {
    successClose.addEventListener("click", () => {
      success.classList.remove("show");
    });

    success.addEventListener("click", (event) => {
      if (event.target === success) {
        success.classList.remove("show");
      }
    });

/* ---------- CLIENT REVIEWS CAROUSEL ---------- */
(function reviews(){
  const stage=document.getElementById('rv-stage');
  if(!stage)return;
  const people=[...stage.querySelectorAll('.rv-person')];
  const textEl=document.getElementById('rv-text');
  const quoteBox=document.getElementById('rv-quote');
  const N=people.length;
  if(!N||!textEl||!quoteBox)return;
  let active=0,timer=null,inView=false,hovered=false,swapT=null;

  function setQuote(i,animate){
    const q=people[i].getAttribute('data-quote')||'';
    if(!animate){textEl.textContent=q;return;}
    quoteBox.classList.add('is-swap');
    clearTimeout(swapT);
    swapT=setTimeout(()=>{textEl.textContent=q;quoteBox.classList.remove('is-swap');},320);
  }

  function place(animate){
    people.forEach((el,i)=>{
      const prev=el.dataset.pos||'';
      let pos='prev';
      if(i===active)pos='active';
      else if(i===(active+1)%N)pos='next';
      // an element crossing directly between top(next) and bottom(prev) must not animate through the middle
      const wrap=(prev==='next'&&pos==='prev')||(prev==='prev'&&pos==='next');
      if(!animate||wrap)el.classList.add('rv-noanim');
      el.classList.remove('is-active','is-next','is-prev');
      el.classList.add('is-'+pos);
      el.dataset.pos=pos;
      el.setAttribute('aria-hidden',pos==='active'?'false':'true');
      if(!animate||wrap){void el.offsetWidth;el.classList.remove('rv-noanim');}
    });
    setQuote(active,animate);
  }

  function go(i,animate){active=((i%N)+N)%N;place(animate);}
  function next(){go(active+1,true);}
  function start(){if(timer||reduceMotion)return;timer=setInterval(()=>{if(inView&&!hovered)next();},1500);}
  function stop(){clearInterval(timer);timer=null;}
  function sync(){(inView&&!hovered&&!reduceMotion)?start():stop();}

  place(false); // initial positions, no animation

  /* ---- keep avatar centres riding the arc ----
     The arc SVG stretches (preserveAspectRatio=none), so map each slot's
     y into viewBox space, bisect the path for that y (monotonic), and map
     the x back to rail pixels. Sets --rv-ox-a / --rv-ox-s on the stage. */
  const rail=stage.querySelector('.rv-rail');
  const arc=stage.querySelector('.rv-arc');
  const arcPath=arc?arc.querySelector('path'):null;
  const AVA_HALF=59; // .rv-ava is 118px wide; inner scales from left centre

  function arcAt(yRail,railBox,arcBox){ // path length + rail x where the arc crosses yRail
    const vy=(yRail-(arcBox.top-railBox.top))*620/arcBox.height;
    let lo=0,hi=arcPath.getTotalLength();
    for(let i=0;i<24;i++){
      const mid=(lo+hi)/2;
      if(arcPath.getPointAtLength(mid).y<vy)lo=mid;else hi=mid;
    }
    const len=(lo+hi)/2;
    return {len,x:(arcBox.left-railBox.left)+arcPath.getPointAtLength(len).x*arcBox.width/200};
  }

  function alignArc(){
    if(!arcPath)return;
    if(!arc.getClientRects().length){ // arc hidden (small screens): CSS fallbacks
      stage.style.removeProperty('--rv-ox-a');
      stage.style.removeProperty('--rv-ox-s');
      arcPath.removeAttribute('stroke-dasharray');
      return;
    }
    const railBox=rail.getBoundingClientRect(),arcBox=arc.getBoundingClientRect();
    const side=people.find(el=>el.classList.contains('is-next'))||people.find(el=>el.classList.contains('is-prev'));
    const anchor=railBox.width*.06,mid=railBox.height/2;
    let oy=176,s=.56;
    stage.style.setProperty('--rv-ox-a',(arcAt(mid,railBox,arcBox).x-anchor-AVA_HALF).toFixed(1)+'px');
    if(side){
      oy=Math.abs(parseFloat(getComputedStyle(side).getPropertyValue('--oy')))||176;
      s=parseFloat(getComputedStyle(side).getPropertyValue('--s'))||.56;
      stage.style.setProperty('--rv-ox-s',(arcAt(mid-oy,railBox,arcBox).x-anchor-AVA_HALF*s).toFixed(1)+'px');
    }
    // carve gaps into the stroke where the line would show through the (translucent) tiles
    const PAD=10,total=arcPath.getTotalLength();
    const slots=side?[[mid-oy,AVA_HALF*s+PAD],[mid,AVA_HALF+PAD],[mid+oy,AVA_HALF*s+PAD]]:[[mid,AVA_HALF+PAD]];
    const dash=[];let cur=0;
    slots.forEach(([y,h])=>{
      const a=arcAt(y-h,railBox,arcBox).len,b=arcAt(y+h,railBox,arcBox).len;
      dash.push(Math.max(0,a-cur),Math.max(0,b-a));cur=Math.max(cur,b);
    });
    dash.push(Math.max(0,total-cur),total);
    arcPath.setAttribute('stroke-dasharray',dash.map(n=>n.toFixed(1)).join(' '));
  }

  alignArc();

  let reviewViewportWidth = innerWidth;

  addEventListener('resize', () => {
    const widthChanged =
      Math.abs(innerWidth - reviewViewportWidth) > 20;

    if (!isTouch || widthChanged) {
      alignArc();
    }

    reviewViewportWidth = innerWidth;
  }, { passive: true });

  people.forEach(el=>{
    el.addEventListener('click',()=>{
      const pos=el.dataset.pos;
      if(pos==='active')return;
      go(pos==='prev'?active-1:active+1,true);
      if(timer){stop();start();} // reset the dwell timer after a manual jump
    });
  });
  // pause only while the cursor point is over the quote text itself
  textEl.addEventListener('mouseenter',()=>{hovered=true;sync();});
  textEl.addEventListener('mouseleave',()=>{hovered=false;sync();});
  document.addEventListener('visibilitychange',()=>{document.hidden?stop():sync();});
  new IntersectionObserver(es=>{inView=es[0].isIntersecting;sync();},{threshold:.35}).observe(stage);
})();
  }
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }
  /*
  * Run the first scroll-state update only after all
  * variables and functions in this script are initialized.
  */
  requestAnimationFrame(() => {
    current = scrollY;
    target = scrollY;
    refreshHeroMetrics();
    refreshSpyOffsets();
    onScroll(current, scrollY);
  });
})();