document.addEventListener("DOMContentLoaded", () => {
  const message = document.querySelector(".message");
  if (message) {
    const text = message.textContent.trim();
    message.innerHTML = "";
    [...text].forEach((char, index) => {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.animationDelay = `${1 + index * 0.1}s`;
      message.appendChild(span);
    });
  }

  // Day Counter
  const dayCounter = document.querySelector(".day-counter");
  if (dayCounter) {
    // Set start date to Valentine's Day 2026
    const startDate = new Date("2026-02-14");
    const today = new Date();

    // Calculate difference in days
    const timeDiff = today - startDate;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    dayCounter.textContent = `Day ${days > 0 ? days : 1}`;
  }

  const rose = document.querySelector(".rose");
  let petalsHTML = "";
  document.querySelectorAll(".petal").forEach((petal) => {
    petalsHTML += petal.outerHTML;
  });

  function setupPetals() {
    const petals = document.querySelectorAll(".petal");

    petals.forEach((petal) => {
      // Set cursor to indicate interactivity
      petal.style.cursor = "grab";

      const startDrag = (e) => {
        e.preventDefault();

        // Stop falling animation if caught mid-air
        if (petal.dataset.fallId) {
          cancelAnimationFrame(Number(petal.dataset.fallId));
          petal.dataset.fallId = "";
        }

        petal.style.cursor = "grabbing";

        // Determine start coordinates based on event type (mouse or touch)
        const startX =
          e.type === "mousedown" ? e.clientX : e.touches[0].clientX;
        const startY =
          e.type === "mousedown" ? e.clientY : e.touches[0].clientY;

        // Get current transform matrix to know where the petal is currently sitting
        const style = window.getComputedStyle(petal);
        const matrix = new DOMMatrix(style.transform);

        // Store initial translation values
        const initialTx = matrix.m41;
        const initialTy = matrix.m42;

        // Disable transition for immediate drag response
        petal.style.transition = "none";
        petal.style.zIndex = "1000"; // Bring to front

        // Velocity tracking
        let lastX = startX;
        let lastY = startY;
        let lastTime = Date.now();
        let vx = 0;
        let vy = 0;

        const onMove = (moveEvent) => {
          const curX =
            moveEvent.type === "mousemove"
              ? moveEvent.clientX
              : moveEvent.touches[0].clientX;
          const curY =
            moveEvent.type === "mousemove"
              ? moveEvent.clientY
              : moveEvent.touches[0].clientY;

          const dx = curX - startX;
          const dy = curY - startY;

          // Update matrix translation with the drag distance
          matrix.m41 = initialTx + dx;
          matrix.m42 = initialTy + dy;

          // Apply the new transform
          petal.style.transform = matrix.toString();

          // Calculate velocity
          const now = Date.now();
          const dt = now - lastTime;
          if (dt > 0) {
            vx = (curX - lastX) / dt;
            vy = (curY - lastY) / dt;
          }
          lastX = curX;
          lastY = curY;
          lastTime = now;
        };

        const onEnd = () => {
          petal.style.cursor = "grab";

          // Clean up listeners
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onEnd);
          document.removeEventListener("touchmove", onMove);
          document.removeEventListener("touchend", onEnd);

          // Calculate distance moved
          const movedX = matrix.m41 - initialTx;
          const movedY = matrix.m42 - initialTy;
          const distance = Math.hypot(movedX, movedY);

          // Reset velocity if stopped
          if (Date.now() - lastTime > 100) {
            vx = 0;
            vy = 0;
          }

          if (distance < 50) {
            // Snap back if not pulled far enough
            petal.style.transition = "transform 0.3s ease-out";
            matrix.m41 = initialTx;
            matrix.m42 = initialTy;
            petal.style.transform = matrix.toString();
            petal.style.zIndex = "";
          } else {
            // Trigger fall/throw animation
            fall(petal, matrix, vx, vy);
          }
        };

        // Attach move/end listeners to document to handle drag outside element
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onEnd);
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onEnd);
      };

      // Attach start listeners to petal
      petal.addEventListener("mousedown", startDrag);
      petal.addEventListener("touchstart", startDrag, { passive: false });
    });
  }

  function fall(petal, matrix, vx = 0, vy = 0) {
    petal.style.transition = "none";
    petal.style.zIndex = "1000";

    let posX = matrix.m41;
    let posY = matrix.m42;
    let velX = vx * 15;
    let velY = vy * 15;
    const gravity = 0.5;

    function animate() {
      velY += gravity;
      posX += velX;
      posY += velY;

      matrix.m41 = posX;
      matrix.m42 = posY;
      petal.style.transform = matrix.toString();

      // Check if off screen (bottom or sides)
      const boundX = window.innerWidth / 2 + 200;
      const boundY = window.innerHeight + 200;

      if (posY < boundY && Math.abs(posX) < boundX) {
        petal.dataset.fallId = requestAnimationFrame(animate);
      } else {
        petal.remove();

        const remainingPetals = document.querySelectorAll(".petal");
        if (remainingPetals.length === 0) {
          setTimeout(() => {
            rose.insertAdjacentHTML("afterbegin", petalsHTML);
            setupPetals();
          }, 100);
        }
      }
    }
    petal.dataset.fallId = requestAnimationFrame(animate);
  }

  setupPetals();
});
