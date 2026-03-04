import { useEffect, useMemo, useState } from "react";

export default function HeroCarousel({
  slides = [],
  autoMs = 5000,
  showContent = true,
}) {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev

  const safeSlides = useMemo(() => slides.filter(Boolean), [slides]);
  const count = safeSlides.length;

  useEffect(() => {
    if (count <= 1) return;

    const timer = setInterval(() => {
      goTo(index + 1, 1);
    }, autoMs);

    return () => clearInterval(timer);
  }, [index, count, autoMs]);

  function normalize(i) {
    if (count === 0) return 0;
    return (i + count) % count;
  }

  function goTo(nextIndex, dir = 1) {
    if (isAnimating || count <= 1) return;
    setDirection(dir);
    setIsAnimating(true);

    const normalized = normalize(nextIndex);
    setIndex(normalized);

    window.setTimeout(() => {
      setIsAnimating(false);
    }, 520);
  }

  const current = safeSlides[index];
  const prevIndex = normalize(index - 1);
  const nextIndex = normalize(index + 1);

  return (
    <div className="heroCarousel" aria-label="WAAHL hero image carousel">
      <div className="heroCarouselViewport">
        {count > 0 && (
          <>
            {/* Prev preview slide */}
            <div
              className={`heroSlide heroSlidePrev ${
                isAnimating && direction === -1 ? "animateIn" : ""
              }`}
              style={{ backgroundImage: `url(${safeSlides[prevIndex].src})` }}
              aria-hidden="true"
            />

            {/* Current slide */}
            <div
              className={`heroSlide heroSlideCurrent ${
                isAnimating
                  ? direction === 1
                    ? "animateOutLeft"
                    : "animateOutRight"
                  : ""
              }`}
              style={{ backgroundImage: `url(${current.src})` }}
            />

            {/* Next preview slide */}
            <div
              className={`heroSlide heroSlideNext ${
                isAnimating && direction === 1 ? "animateIn" : ""
              }`}
              style={{ backgroundImage: `url(${safeSlides[nextIndex].src})` }}
              aria-hidden="true"
            />

            <div className="heroSlideOverlay" />

            {showContent && (current?.kicker || current?.title || current?.subtitle) ? (
              <div className="heroSlideContent">
                {current.kicker ? <p className="heroKicker">{current.kicker}</p> : null}
                {current.title ? <h1 className="heroTitle">{current.title}</h1> : null}
                {current.subtitle ? <p className="heroSubtitle">{current.subtitle}</p> : null}
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="heroCarouselControls">
        <button
          type="button"
          className="heroArrow"
          aria-label="Previous slide"
          onClick={() => goTo(index - 1, -1)}
        >
          ‹
        </button>

        <div className="heroDots" role="tablist" aria-label="Slide navigation">
          {safeSlides.map((slide, i) => (
            <button
              key={`${slide.title || "slide"}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              className={`heroDot ${i === index ? "active" : ""}`}
              onClick={() => {
                if (i === index) return;
                goTo(i, i > index ? 1 : -1);
              }}
            />
          ))}
        </div>

        <button
          type="button"
          className="heroArrow"
          aria-label="Next slide"
          onClick={() => goTo(index + 1, 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}