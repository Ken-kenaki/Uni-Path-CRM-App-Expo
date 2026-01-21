"use client";

import React, { useEffect, useState } from "react";

type Theme = "light" | "dark" | "girly" | "colorful";

export default function MobileBanterLoader() {
  const [theme, setTheme] = useState<Theme>("dark");

  // Detect theme from document root
  useEffect(() => {
    const detectTheme = () => {
      const htmlClass = document.documentElement.className;
      if (htmlClass.includes("girly")) setTheme("girly");
      else if (htmlClass.includes("colorful")) setTheme("colorful");
      else if (htmlClass.includes("dark")) setTheme("dark");
      else setTheme("light");
    };

    detectTheme();

    // Watch for theme changes
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Theme-based colors
  const getBoxColor = () => {
    switch (theme) {
      case "light":
        return "#000000";
      case "dark":
        return "#ffffff";
      case "girly":
        return "#db2777";
      case "colorful":
        return "#3b82f6";
      default:
        return "#9333ea";
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-[200px]">
      <div className="mobile-banter-loader">
        <div className="mobile-banter-loader__container">
          {/* Main rotating cube */}
          <div className="mobile-banter-loader__cube">
            <div className="mobile-banter-loader__face mobile-banter-loader__face--front"></div>
            <div className="mobile-banter-loader__face mobile-banter-loader__face--back"></div>
            <div className="mobile-banter-loader__face mobile-banter-loader__face--right"></div>
            <div className="mobile-banter-loader__face mobile-banter-loader__face--left"></div>
            <div className="mobile-banter-loader__face mobile-banter-loader__face--top"></div>
            <div className="mobile-banter-loader__face mobile-banter-loader__face--bottom"></div>
          </div>

          {/* Pulsing dots around */}
          <div className="mobile-banter-loader__dot mobile-banter-loader__dot--1"></div>
          <div className="mobile-banter-loader__dot mobile-banter-loader__dot--2"></div>
          <div className="mobile-banter-loader__dot mobile-banter-loader__dot--3"></div>
          <div className="mobile-banter-loader__dot mobile-banter-loader__dot--4"></div>
        </div>
      </div>

      <style jsx>{`
        /* Mobile-optimized loader */
        .mobile-banter-loader {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto;
        }

        .mobile-banter-loader__container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        /* 3D Cube */
        .mobile-banter-loader__cube {
          width: 60px;
          height: 60px;
          position: absolute;
          top: 30px;
          left: 30px;
          transform-style: preserve-3d;
          animation: cube-rotate 3s infinite linear;
        }

        .mobile-banter-loader__face {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 8px;
          background: ${getBoxColor()};
          opacity: 0.8;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          transition: background-color 0.3s ease;
        }

        .mobile-banter-loader__face--front {
          transform: rotateY(0deg) translateZ(30px);
          background: ${getBoxColor()};
        }

        .mobile-banter-loader__face--back {
          transform: rotateY(180deg) translateZ(30px);
          background: ${getBoxColor()}99;
        }

        .mobile-banter-loader__face--right {
          transform: rotateY(90deg) translateZ(30px);
          background: ${getBoxColor()}cc;
        }

        .mobile-banter-loader__face--left {
          transform: rotateY(-90deg) translateZ(30px);
          background: ${getBoxColor()}cc;
        }

        .mobile-banter-loader__face--top {
          transform: rotateX(90deg) translateZ(30px);
          background: ${getBoxColor()}99;
        }

        .mobile-banter-loader__face--bottom {
          transform: rotateX(-90deg) translateZ(30px);
          background: ${getBoxColor()}66;
        }

        /* Pulsing dots */
        .mobile-banter-loader__dot {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${getBoxColor()};
          opacity: 0.6;
          transition: background-color 0.3s ease;
        }

        .mobile-banter-loader__dot--1 {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          animation: pulse-1 2s infinite ease-in-out;
        }

        .mobile-banter-loader__dot--2 {
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          animation: pulse-2 2s infinite ease-in-out;
        }

        .mobile-banter-loader__dot--3 {
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          animation: pulse-3 2s infinite ease-in-out;
        }

        .mobile-banter-loader__dot--4 {
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          animation: pulse-4 2s infinite ease-in-out;
        }

        /* Animations */
        @keyframes cube-rotate {
          0% {
            transform: rotateX(0) rotateY(0) rotateZ(0);
          }
          25% {
            transform: rotateX(45deg) rotateY(45deg) rotateZ(45deg);
          }
          50% {
            transform: rotateX(90deg) rotateY(90deg) rotateZ(90deg);
          }
          75% {
            transform: rotateX(135deg) rotateY(135deg) rotateZ(135deg);
          }
          100% {
            transform: rotateX(180deg) rotateY(180deg) rotateZ(180deg);
          }
        }

        @keyframes pulse-1 {
          0%,
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateX(-50%) scale(1.3);
            opacity: 1;
          }
        }

        @keyframes pulse-2 {
          0%,
          100% {
            transform: translateY(-50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-50%) scale(1.3);
            opacity: 1;
            animation-delay: 0.5s;
          }
        }

        @keyframes pulse-3 {
          0%,
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateX(-50%) scale(1.3);
            opacity: 1;
            animation-delay: 1s;
          }
        }

        @keyframes pulse-4 {
          0%,
          100% {
            transform: translateY(-50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-50%) scale(1.3);
            opacity: 1;
            animation-delay: 1.5s;
          }
        }

        /* Media queries for mobile responsiveness */
        @media (max-width: 480px) {
          .mobile-banter-loader {
            width: 100px;
            height: 100px;
          }

          .mobile-banter-loader__cube {
            width: 50px;
            height: 50px;
            top: 25px;
            left: 25px;
          }

          .mobile-banter-loader__face--front {
            transform: rotateY(0deg) translateZ(25px);
          }

          .mobile-banter-loader__face--back {
            transform: rotateY(180deg) translateZ(25px);
          }

          .mobile-banter-loader__face--right {
            transform: rotateY(90deg) translateZ(25px);
          }

          .mobile-banter-loader__face--left {
            transform: rotateY(-90deg) translateZ(25px);
          }

          .mobile-banter-loader__face--top {
            transform: rotateX(90deg) translateZ(25px);
          }

          .mobile-banter-loader__face--bottom {
            transform: rotateX(-90deg) translateZ(25px);
          }

          .mobile-banter-loader__dot {
            width: 14px;
            height: 14px;
          }
        }

        @media (max-width: 360px) {
          .mobile-banter-loader {
            width: 80px;
            height: 80px;
          }

          .mobile-banter-loader__cube {
            width: 40px;
            height: 40px;
            top: 20px;
            left: 20px;
          }

          .mobile-banter-loader__face--front {
            transform: rotateY(0deg) translateZ(20px);
          }

          .mobile-banter-loader__face--back {
            transform: rotateY(180deg) translateZ(20px);
          }

          .mobile-banter-loader__face--right {
            transform: rotateY(90deg) translateZ(20px);
          }

          .mobile-banter-loader__face--left {
            transform: rotateY(-90deg) translateZ(20px);
          }

          .mobile-banter-loader__face--top {
            transform: rotateX(90deg) translateZ(20px);
          }

          .mobile-banter-loader__face--bottom {
            transform: rotateX(-90deg) translateZ(20px);
          }

          .mobile-banter-loader__dot {
            width: 12px;
            height: 12px;
          }
        }
      `}</style>
    </div>
  );
}
