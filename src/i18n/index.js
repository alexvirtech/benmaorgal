'use client'

import { useState, useEffect, useCallback } from 'react'
import he from './he.js'
import en from './en.js'

const dicts = { he, en }
const DEFAULT_LANG = 'he'
const STORAGE_KEY = 'benmaorgal-lang'

export function getLang() {
  if (typeof window === 'undefined') return DEFAULT_LANG
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG
  } catch {
    return DEFAULT_LANG
  }
}

export function setLang(lang) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, lang)
    window.dispatchEvent(new Event('benmaorgal-lang-change'))
  } catch { /* noop */ }
}

export function t(key, vars) {
  const lang = getLang()
  const dict = dicts[lang] || dicts[DEFAULT_LANG]
  let str = dict[key] ?? dicts[DEFAULT_LANG][key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v)
    }
  }
  return str
}

export function tWith(lang, key, vars) {
  const dict = dicts[lang] || dicts[DEFAULT_LANG]
  let str = dict[key] ?? dicts[DEFAULT_LANG][key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v)
    }
  }
  return str
}

export function useLang() {
  const [lang, _setLang] = useState(DEFAULT_LANG)

  useEffect(() => {
    _setLang(getLang())

    const onChange = () => _setLang(getLang())
    const onStorage = (e) => { if (e.key === STORAGE_KEY) onChange() }
    window.addEventListener('benmaorgal-lang-change', onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('benmaorgal-lang-change', onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const update = useCallback((newLang) => {
    setLang(newLang)
    _setLang(newLang)
  }, [])

  const translate = useCallback((key, vars) => {
    const dict = dicts[lang] || dicts[DEFAULT_LANG]
    let str = dict[key] ?? dicts[DEFAULT_LANG][key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, v)
      }
    }
    return str
  }, [lang])

  return { lang, setLang: update, t: translate }
}

export function isRTL(lang) {
  return lang === 'he'
}
