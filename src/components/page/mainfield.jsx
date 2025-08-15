"use client";
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "@/styles/index.module.scss";

export default function Mainfield() {
  var MAX_LENGTH = 24;

  var [fields, setFields] = useState([{ value: "" }]);
  var [messages, setMessages] = useState([]);
  var [isLoading, setIsLoading] = useState(false);
  var [showInputs, setShowInputs] = useState(true);
  var [isAnimating, setIsAnimating] = useState(false);

  var inputRefs = useRef([]);
  var hiddenSpanRefs = useRef([]);
  var focusNext = useRef(false);
  var responseRefs = useRef([]);
  var isInitialized = useRef(false);

  function initializeComponent() {
    setFields([{ value: "" }]);
    setMessages([]);
    setIsLoading(false);
    setShowInputs(true);
    setIsAnimating(false);
    inputRefs.current = [];
    hiddenSpanRefs.current = [];
    responseRefs.current = [];
    focusNext.current = false;
    isInitialized.current = true;
  }

  function setInputRef(el, index) {
    inputRefs.current[index] = el;
  }

  function setSpanRef(el, index) {
    hiddenSpanRefs.current[index] = el;
  }

  function setResponseRef(el, index) {
    if (el) {
      responseRefs.current[index] = el;
    }
  }

  function handleInputChange(index, value) {
    var updated = fields.slice();
    updated[index].value = value;
    setFields(updated);

    if (value.length >= MAX_LENGTH && index === fields.length - 1) {
      updated.push({ value: "" });
      setFields(updated);
      focusNext.current = true;
    }
  }

  function handleKeyDown(e, index) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      var currentInput = fields[index].value.trim();
      if (currentInput && index === fields.length - 1) {
        var newFields = fields.concat([{ value: "" }]);
        setFields(newFields);
        focusNext.current = true;
      }
    }

    if (e.key === "Backspace" && fields[index].value === "") {
      if (fields.length > 1) {
        e.preventDefault();
        var updated = fields.filter(function (_, i) {
          return i !== index;
        });
        setFields(updated);
        setTimeout(function () {
          var target = Math.max(0, index - 1);
          if (inputRefs.current[target]) {
            inputRefs.current[target].focus();
          }
        }, 0);
      }
    }
  }

  function handleInputBlur(index) {
    var trimmed = fields[index].value.slice(0, MAX_LENGTH - 2);
    if (fields[index].value !== trimmed) {
      var updated = fields.slice();
      updated[index].value = trimmed;
      setFields(updated);
    }
  }

  function updateInputSizes() {
    fields.forEach(function (field, index) {
      var input = inputRefs.current[index];
      var span = hiddenSpanRefs.current[index];
      if (input && span) {
        span.textContent = field.value || input.placeholder || "あ";
        var rect = span.getBoundingClientRect();
        input.style.width = Math.max(rect.width) + "px";
        input.style.height = Math.max(rect.height) + "px";
      }
    });
  }

  function animateResponse(responseElement, messageIndex) {
    var charElements = responseElement.querySelectorAll(`[data-response-char][data-response-id="${messageIndex}"]`);
    
    if (charElements.length === 0) return Promise.resolve();
    
    var tl = gsap.timeline();
    
    tl.fromTo(responseElement, 
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    );
    
    tl.fromTo(charElements,
      { opacity: 0, x: -10 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.04,
        duration: 0.4,
        ease: "power2.out"
      },
      "-=0.2"
    );
    
    return new Promise(function(resolve) {
      tl.eventCallback("onComplete", resolve);
    });
  }

  function formatConversationHistory() {
    return messages.map(function(message) {
      if (message.type === "user") {
        return {
          type: "user",
          content: Array.isArray(message.content) 
            ? message.content.join("") 
            : message.content
        };
      } else {
        return {
          type: "response",
          content: message.content
        };
      }
    });
  }

  async function handleConfirm() {
    var cleanFields = fields.map(function (f) {
      return f.value.trim();
    }).filter(Boolean);

    if (cleanFields.length === 0) return;

    setIsLoading(true);
    setShowInputs(false);
    
    var newUserMessage = {
      type: "user",
      content: cleanFields.map(function (v) {
        return "「" + v + "」";
      })
    };
    
    setMessages(function (prev) {
      return prev.concat(newUserMessage);
    });
    setFields([{ value: "" }]);

    try {
      var conversationHistory = formatConversationHistory();
      
      var res = await fetch("/api/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: cleanFields.join(""),
          conversationHistory: conversationHistory
        }),
      });

      if (res.ok) {
        var data = await res.json();
        var newMessageIndex = messages.length + 1;
        
        setMessages(function (prev) {
          return prev.concat({ type: "response", content: data.response });
        });

        setIsAnimating(true);

        setTimeout(function() {
          var responseElement = responseRefs.current[newMessageIndex];
          if (responseElement) {
            animateResponse(responseElement, newMessageIndex).then(function() {
              setIsAnimating(false);
              setShowInputs(true);
              setIsLoading(false);
            });
          } else {
            setIsAnimating(false);
            setShowInputs(true);
            setIsLoading(false);
          }
        }, 100);
      } else {
        console.error("API request failed");
        setIsAnimating(false);
        setShowInputs(true);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error:", err);
      setIsAnimating(false);
      setShowInputs(true);
      setIsLoading(false);
    }
  }

  useEffect(function () {
    updateInputSizes();

    if (focusNext.current && showInputs) {
      var lastIndex = fields.length - 1;
      var input = inputRefs.current[lastIndex];
      if (input) {
        input.focus();
        focusNext.current = false;
      }
    }
  }, [fields, showInputs]);

  useEffect(function () {
    if (showInputs && !isLoading && !isAnimating) {
      setTimeout(function () {
        updateInputSizes();
      }, 0);
    }
  }, [showInputs, isLoading, isAnimating]);

  useEffect(function () {
    if (!isInitialized.current) {
      initializeComponent();
      console.log("Mainfield component initialized");
    }
  }, []);

  useEffect(function () {
    return function cleanup() {
      console.log("Mainfield component cleanup");
    };
  }, []);

  return (
    <section className={styles.mainfield}>

      {messages.map(function (m, i) {
        if (m.type === "user") {
          return (
            <div key={i} className={styles.userMessage}>
              <p>
                {m.content.map(function (text, idx) {
                  return (
                    <span key={idx}>
                      {text}
                      {idx < m.content.length - 1 && <br />}
                    </span>
                  );
                })}
              </p>
            </div>
          );
        } else {
          return (
            <div 
              key={i} 
              className={styles.response}
              ref={function(el) { setResponseRef(el, i); }}
              style={{ opacity: 0 }}
            >
              <p>
                {m.content.split("").map(function (char, idx) {
                  return char === "\n" ? (
                    <br key={idx} />
                  ) : (
                    <span
                      key={idx}
                      className={styles.responseChar}
                      data-response-char
                      data-response-id={i}
                    >
                      {char}
                    </span>
                  );
                })}
              </p>
            </div>
          );
        }
      })}

      {isLoading && !isAnimating ? (
        <div className={styles.loading}>
          <p>執筆中・・・</p>
        </div>
      ) : (
        showInputs && fields.map(function (field, index) {
          return (
            <div key={index} className={styles.inputWrapper}>
              <span className={styles.quote}>「</span>
              <div className={styles.inputContainer}>
                <input
                  ref={function (el) { setInputRef(el, index); }}
                  type="text"
                  className={styles.mf__input}
                  placeholder="台詞を入力"
                  value={field.value}
                  onChange={function (e) {
                    handleInputChange(index, e.target.value);
                  }}
                  onKeyDown={function (e) {
                    handleKeyDown(e, index);
                  }}
                  onBlur={function () {
                    handleInputBlur(index);
                  }}
                />
                <span
                  ref={function (el) { setSpanRef(el, index); }}
                  className={styles.hiddenMeasure}
                  aria-hidden="true"
                />
              </div>
              <span className={styles.quote}>」</span>

              {index === fields.length - 1 && (
                <p className={styles.kakutei} onClick={handleConfirm}>
                  確定
                </p>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}