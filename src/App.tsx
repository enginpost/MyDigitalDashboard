import React, { useState, useEffect } from 'react';
import './App.css';
import WeatherForecast from './components/WeatherForecast';
import LocalNews from './components/LocalNews';
import NationalNews from './components/NationalNews';
import Calendar from './components/Calendar';

interface Slide {
  id: string;
  title: string;
  content?: string;
  background: string;
}

type SlidePosition = 'active' | 'next' | 'previous';

const SLIDES: Slide[] = [
  { 
    id: 'weather', 
    title: "Local Weather",
    background: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80"
  },
  { 
    id: 'local', 
    title: "Local News",
    background: "https://images.unsplash.com/photo-1592595896616-c37162298647?auto=format&fit=crop&w=1200&q=80"
  },
  { 
    id: 'national', 
    title: "National News",
    background: "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80"
  }
];

function App() {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  const totalSlides = SLIDES.length;
  const nextIndex = (currentIndex + 1) % totalSlides;

  useEffect(() => {
    // Preload images
    SLIDES.forEach((slide: Slide) => {
      const img = new Image();
      img.src = slide.background;
      img.onload = () => setLoadedImages(prev => {
        const newSet = new Set(prev);
        newSet.add(slide.id);
        return newSet;
      });
    });

    if (totalSlides <= 1) return; // Don't animate if there's only one or no slides

    const interval = setInterval(() => {
      setCurrentIndex(current => (current + 1) % totalSlides);
    }, 15000);

    return () => clearInterval(interval);
  }, [totalSlides]);


  return (
    <div className="App">
      <div className="top-row">
        <div id="Top_Left_Panel" className="top-panel">
          Top Left Panel
        </div>
        <div id="Top_Right_Panel" className="top-panel">
          <div className="slide-container">
            {SLIDES.map((slide: Slide, index: number) => {
              let position: SlidePosition = 'previous';
              if (index === currentIndex) position = 'active';
              else if (index === nextIndex) position = 'next';
              
              return (
                <div
                  key={slide.id}
                  className={`slide ${position} ${loadedImages.has(slide.id) ? 'loaded' : 'loading'}`}
                  style={{
                    backgroundImage: loadedImages.has(slide.id)
                      ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url(${slide.background})`
                      : undefined
                  }}
                >
                  <div className="slide-title">{slide.title}</div>
                  <div className="slide-content">
                    {slide.id === 'weather' && <WeatherForecast />}
                    {slide.id === 'local' && <LocalNews />}
                    {slide.id === 'national' && <NationalNews />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div id="Calendar_Panel" className="calendar-panel">
        <Calendar />
      </div>
      <div id="Footer_Panel" className="footer-panel">
        Footer Panel
      </div>
    </div>
  );
}

export default App;
