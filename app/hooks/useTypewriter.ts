import { useState, useEffect, useCallback } from 'react'

interface UseTypewriterOptions {
  text: string
  speed?: number // milliseconds per character
  delay?: number // delay before starting
  onComplete?: () => void
}

export const useTypewriter = ({ 
  text, 
  speed = 30, // Slightly faster than ChatGPT for smoother feel
  delay = 0,
  onComplete 
}: UseTypewriterOptions) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const startTyping = useCallback(() => {
    setIsTyping(true)
    setCurrentIndex(0)
    setDisplayedText('')
  }, [])

  const reset = useCallback(() => {
    setIsTyping(false)
    setCurrentIndex(0)
    setDisplayedText('')
  }, [])

  useEffect(() => {
    if (!text) {
      reset()
      return
    }

    // Reset when text changes
    if (displayedText !== text) {
      startTyping()
    }
  }, [text, displayedText, startTyping, reset])

  useEffect(() => {
    if (!isTyping || currentIndex >= text.length) {
      if (isTyping && onComplete) {
        onComplete()
      }
      setIsTyping(false)
      return
    }

    const timer = setTimeout(() => {
      setDisplayedText(prev => {
        const nextChar = text[currentIndex]
        const newText = prev + nextChar
        
        // Handle markdown formatting for better visual flow
        if (nextChar === '*' && text[currentIndex + 1] === '*') {
          // Skip the second asterisk to avoid double rendering
          setCurrentIndex(prev => prev + 2)
          return newText + '*'
        }
        
        setCurrentIndex(prev => prev + 1)
        return newText
      })
    }, speed)

    return () => clearTimeout(timer)
  }, [currentIndex, text, isTyping, speed, onComplete])

  return {
    displayedText,
    isTyping,
    reset,
    startTyping
  }
} 