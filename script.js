(function () {
  "use strict";

  const reduceMotion = matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const isTouch = matchMedia("(pointer: coarse)").matches;
  const useSmooth = finePointer && !reduceMotion;
  const vh = () => innerHeight;

  /* ---------- SMOOTH SCROLL ENGINE ---------- */
  const smooth = document.getElementById("smooth"),
    content = document.getElementById("page-content"),
    ghost = document.getElementById("ghost");

  let target = 0,
    current = 0;

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
      new ResizeObserver(setGhost).observe(content);
    }

    addEventListener("resize", setGhost);
  } else {
    addEventListener(
      "scroll",
      () => {
        current = scrollY;
        onScroll(current);
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

  let lastY = 0,
    ticking = false;

  function onScroll(v) {
    const h = vh(),
      spH = spacerEl.offsetHeight,
      max =
        (useSmooth
          ? spH + content.offsetHeight
          : document.documentElement.scrollHeight) - h;

    progress.style.width = Math.min((v / max) * 100, 100) + "%";

    const kText = Math.min(v / (h * 0.55), 1);
    const kDim = Math.max(
      0,
      Math.min(v / Math.max(spH - h, 1), 1)
    );

    heroDim.style.opacity = (kDim * 1.02).toFixed(3);

    if (!reduceMotion) {
      heroInner.style.transform = `translateY(${v * 0.16}px) scale(${
        1 - kText * 0.06
      })`;

      heroInner.style.opacity = (1 - kText * 0.92).toFixed(3);

      heroBg.style.transform = `scale(${
        1.06 + kDim * 0.07
      }) translateY(${v * 0.045}px)`;

      sealEl.style.opacity = (1 - kText * 2).toFixed(2);

      for (const card of fcards) {
        const y =
          Number(card.dataset.start) * h -
          v * Number(card.dataset.speed);

        card.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      }
    }

    if (
      v > 160 &&
      v > lastY + 1 &&
      !document.body.classList.contains("menu-open")
    ) {
      header.classList.add("hide");
    } else if (v < lastY - 1 || v <= 160) {
      header.classList.remove("hide");
    }

    lastY = v;
    teamScroll(v);
    spy(v);
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
      current += (target - current) * 0.085;

      if (Math.abs(target - current) < 0.05) {
        current = target;
      }

      smooth.style.transform = `translate3d(0, ${-current}px, 0)`;
      onScroll(current);
    }

    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

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

    const y =
      current + element.getBoundingClientRect().top - offset;

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

  function spy() {
    let active = "home";

    spySections.forEach((id) => {
      if (id === "home") {
        return;
      }

      const element = document.getElementById(id);

      if (
        element &&
        element.getBoundingClientRect().top < vh() * 0.45
      ) {
        active = id;
      }
    });

    spyLinks.forEach((link) => {
      link.classList.toggle(
        "active",
        link.dataset.spy === active
      );
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
    if (innerWidth < 900) {
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

      const middleY = Math.min(
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

  function treeInit() {
    drawTree();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(treeInit);
  } else {
    setTimeout(treeInit, 600);
  }

  addEventListener("resize", drawTree);

  new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) {
        return;
      }

      drawTree();

      if (!reduceMotion) {
        animateTree();
      } else {
        treeDrawn = true;
        drawTree();
      }
    },
    { threshold: 0.25 }
  ).observe(tree);

  /* ---------- STAT COUNTERS ---------- */
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const element = entry.target;
        const targetValue = Number(element.dataset.count);
        const suffix = element.dataset.suffix || "";
        const duration = 1800;
        const startTime = performance.now();

        function step(time) {
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
        statObserver.unobserve(element);
      });
    },
    { threshold: 0.6 }
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

  if (serviceSelect && serviceField) {
    serviceSelect.addEventListener("change", () => {
      serviceField.classList.toggle(
        "filled",
        Boolean(serviceSelect.value)
      );
    });
  }

  if (form && success && serviceSelect) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = document.getElementById("f-name");
      const email = document.getElementById("f-email");

      let valid = true;

      [name, email, serviceSelect].forEach((field) => {
        if (!field || field.value) {
          return;
        }

        valid = false;
        field.style.borderBottomColor = "#b3452f";

        setTimeout(() => {
          field.style.borderBottomColor = "";
        }, 1800);
      });

      if (!valid) {
        return;
      }

      success.classList.add("show");
      form.reset();

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
  function start(){if(timer||reduceMotion)return;timer=setInterval(()=>{if(inView&&!hovered)next();},4000);}
  function stop(){clearInterval(timer);timer=null;}
  function sync(){(inView&&!hovered&&!reduceMotion)?start():stop();}

  place(false); // initial positions, no animation

  people.forEach(el=>{
    el.addEventListener('click',()=>{
      const pos=el.dataset.pos;
      if(pos==='active')return;
      go(pos==='prev'?active-1:active+1,true);
      if(timer){stop();start();} // reset the dwell timer after a manual jump
    });
  });
  stage.addEventListener('mouseenter',()=>{hovered=true;sync();});
  stage.addEventListener('mouseleave',()=>{hovered=false;sync();});
  document.addEventListener('visibilitychange',()=>{document.hidden?stop():sync();});
  new IntersectionObserver(es=>{inView=es[0].isIntersecting;sync();},{threshold:.35}).observe(stage);
})();
  }

  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }
})();