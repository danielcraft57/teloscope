package fr.danielcraft.teloscope.screening

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant

object ScreeningPrefs {
  private const val PREFS = "teloscope_screening"
  private const val KEY_ENABLED = "enabled"
  private const val KEY_NUMBERS = "commercial_numbers"
  private const val KEY_THRESHOLD = "spam_threshold"
  private const val KEY_MESSAGE = "message_path"
  private const val KEY_BLOCKS = "blocked_calls"

  fun isEnabled(ctx: Context): Boolean =
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_ENABLED, false)

  fun sync(
    ctx: Context,
    enabled: Boolean,
    numbers: List<String>,
    spamThreshold: Int,
    messagePath: String?
  ) {
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean(KEY_ENABLED, enabled)
      .putStringSet(KEY_NUMBERS, numbers.map { normalizeNumber(it) }.toSet())
      .putInt(KEY_THRESHOLD, spamThreshold)
      .putString(KEY_MESSAGE, messagePath)
      .apply()
  }

  fun shouldBlock(ctx: Context, phone: String): Boolean {
    val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean(KEY_ENABLED, false)) return false
    val normalized = normalizeNumber(phone)
    val set = prefs.getStringSet(KEY_NUMBERS, emptySet()) ?: emptySet()
    return set.contains(normalized)
  }

  fun logBlock(ctx: Context, phone: String, reason: String) {
    val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY_BLOCKS, "[]") ?: "[]"
    val arr = JSONArray(raw)
    val entry = JSONObject()
      .put("id", System.currentTimeMillis().toString())
      .put("phone", normalizeNumber(phone))
      .put("at", Instant.now().toString())
      .put("reason", reason)
    val next = JSONArray()
    next.put(entry)
    for (i in 0 until minOf(arr.length(), 199)) {
      next.put(arr.getJSONObject(i))
    }
    prefs.edit().putString(KEY_BLOCKS, next.toString()).apply()
  }

  fun getBlockedCalls(ctx: Context): JSONArray {
    val raw = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_BLOCKS, "[]")
    return JSONArray(raw ?: "[]")
  }

  fun normalizeNumber(raw: String): String {
    var s = raw.trim().replace(Regex("[\\s.\\-()]"), "")
    if (s.startsWith("00")) s = "+${s.substring(2)}"
    if (Regex("^0[1-9]\\d{8}$").matches(s)) s = "+33${s.substring(1)}"
    if (!s.startsWith("+")) s = "+$s"
    return s
  }
}
