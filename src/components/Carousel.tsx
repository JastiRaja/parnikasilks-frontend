import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import axios from '../utils/axios';
import { BACKEND_URL } from '../utils/constants';

interface Slide {
  _id: string;
  title: string;
  description?: string;
  image: string;
  link?: string;
  linkText?: string;
}

const Carousel: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      setError(null);
      const response = await axios.get('/api/slides');
      if (response.data.success) {
        if (response.data.slides && response.data.slides.length > 0) {
          setSlides(response.data.slides);
        } else {
          // No slides available - this is fine, component will return null
          setSlides([]);
        }
      } else {
        // If API returns unsuccessful response, just set empty slides
        setSlides([]);
      }
    } catch (error: any) {
      // Silently handle errors - don't expose backend URLs or error details
      // 404 or any other error means no slides are available, which is fine
      if (error.response?.status === 404) {
        // Endpoint doesn't exist or no slides - this is expected
        setSlides([]);
      } else {
        // For other errors, silently fail and show no slides
        setSlides([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const getImageUrl = (imageId: string): string => {
    if (!imageId) return '';
    return `${BACKEND_URL}/api/admin/images/${imageId}`;
  };

  if (loading) {
    return (
      <div className="relative w-full h-[300px] md:h-[350px] lg:h-[400px] flex items-center justify-center bg-gradient-to-br from-pink-50 to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (slides.length === 0) {
    // Don't show anything if no slides - this is expected if no slides are created yet
    return null;
  }

  return (
    <div className="relative w-full h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden bg-gradient-to-br from-pink-50 to-yellow-50">
      {slides.map((slide, index) => (
        <div
          key={slide._id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
            <img
              src={getImageUrl(slide.image)}
              alt={slide.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/Placeholder.png';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-xl md:max-w-2xl text-white animate-slide-up">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold mb-2 md:mb-3 drop-shadow-lg">
                    {slide.title}
                  </h2>
                  {slide.description && (
                    <p className="text-sm md:text-base mb-4 md:mb-6 text-gray-100 drop-shadow-md line-clamp-2">
                      {slide.description}
                    </p>
                  )}
                  {slide.link && (
                    <Link
                      to={slide.link}
                      className="inline-block px-5 py-2 md:px-6 md:py-3 bg-pink-600 text-white rounded-lg font-semibold text-sm md:text-base hover:bg-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 pointer-events-auto"
                    >
                      {slide.linkText || 'Shop Now'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;

