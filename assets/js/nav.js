(() => {
  if (!Object.hasOwn(HTMLElement.prototype, "popover")) {
    const polyfill = document.createElement("script");
    polyfill.type = "module";
    polyfill.src = "https://unpkg.com/@oddbird/popover-polyfill@latest/dist/popover.min.js";
    document.head.appendChild(polyfill);
  }

  const header = document.querySelector(".site-header");
  if (!header) return;

  const inner = header.querySelector(".header-inner");
  const menu = header.querySelector(".site-menu");
  const dropdownItems = [...header.querySelectorAll(".nav-dropdown")];
  if (!inner || !menu) return;

  let isWide = false;
  let lastCollapsedWidth = 0;

  const syncSubmenuState = (wide) => {
    for (const item of dropdownItems) {
      const trigger = item.querySelector(".dropdown-trigger");
      const list = item.querySelector(".dropdown-list");
      if (!trigger || !list) continue;

      delete item.dataset.hoverPreview;
      if (wide) {
        list.setAttribute("popover", "auto");
        list.hidden = false;
        trigger.setAttribute("aria-expanded", "false");
      } else {
        if (list.matches(":popover-open")) {
          list.hidePopover();
        }
        list.removeAttribute("popover");
        list.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
    }
  };

  const measureLayout = () => {
    const currentWidth = header.getBoundingClientRect().width;
    if (!isWide && currentWidth <= lastCollapsedWidth) return;

    const wasMenuOpen = !isWide && menu.matches(":popover-open, .\\:popover-open");
    header.classList.add("is-measuring", "is-wide");
    menu.removeAttribute("popover");

    const fitsInline = inner.scrollWidth <= inner.clientWidth;

    if (fitsInline) {
      isWide = true;
      lastCollapsedWidth = 0;
      syncSubmenuState(true);
    } else {
      isWide = false;
      lastCollapsedWidth = currentWidth;
      header.classList.remove("is-wide");
      menu.setAttribute("popover", "auto");
      syncSubmenuState(false);
      if (wasMenuOpen) {
        try {
          menu.showPopover();
        } catch {
          // Ignore if popover cannot be shown during resize
        }
      }
    }

    requestAnimationFrame(() => {
      header.classList.remove("is-measuring");
    });
  };

  const ro = new ResizeObserver(() => measureLayout());
  ro.observe(header);
  ro.observe(menu);

  for (const item of dropdownItems) {
    const trigger = item.querySelector(".dropdown-trigger");
    const list = item.querySelector(".dropdown-list");
    if (!trigger || !list) continue;

    trigger.addEventListener("click", (event) => {
      if (isWide) {
        if (item.dataset.hoverPreview === "true") {
          delete item.dataset.hoverPreview;
          event.preventDefault();
        }
        return;
      }
      const willOpen = list.hidden;
      list.hidden = !willOpen;
      trigger.setAttribute("aria-expanded", String(willOpen));
    });

    list.addEventListener("toggle", (event) => {
      if (!isWide) return;
      const opened = event.newState === "open";
      trigger.setAttribute("aria-expanded", String(opened));
      if (!opened) {
        delete item.dataset.hoverPreview;
        return;
      }

      if (!CSS.supports("position-area", "block-end")) {
        const triggerRect = trigger.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        let top = triggerRect.bottom + 8;
        if (top + listRect.height > window.innerHeight) {
          top = Math.max(8, triggerRect.top - listRect.height - 8);
        }
        const left = Math.max(8, Math.min(triggerRect.left, window.innerWidth - listRect.width - 8));
        list.style.top = `${top}px`;
        list.style.left = `${left}px`;
      }
    });

    item.addEventListener("pointerenter", (event) => {
      if (!isWide || event.pointerType === "touch") return;
      if (!window.matchMedia("(hover: hover)").matches) return;
      if (!list.matches(":popover-open")) {
        item.dataset.hoverPreview = "true";
        try {
          list.showPopover({ source: trigger });
        } catch {
          delete item.dataset.hoverPreview;
        }
      }
    });

    item.addEventListener("pointerleave", (event) => {
      if (!isWide || event.pointerType === "touch") return;
      if (item.dataset.hoverPreview === "true" && list.matches(":popover-open")) {
        delete item.dataset.hoverPreview;
        list.hidePopover();
      }
    });

    item.addEventListener("focusout", (event) => {
      if (!isWide) return;
      if (event.relatedTarget && !item.contains(event.relatedTarget) && list.matches(":popover-open")) {
        delete item.dataset.hoverPreview;
        list.hidePopover();
      }
    });
  }

  measureLayout();
})();
