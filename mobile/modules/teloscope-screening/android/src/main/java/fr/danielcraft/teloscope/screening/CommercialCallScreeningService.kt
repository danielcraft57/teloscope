package fr.danielcraft.teloscope.screening

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import androidx.annotation.RequiresApi

@RequiresApi(Build.VERSION_CODES.N)
class CommercialCallScreeningService : CallScreeningService() {
  override fun onScreenCall(callDetails: Call.Details) {
    val handle = callDetails.handle?.schemeSpecificPart ?: ""
    val phone = ScreeningPrefs.normalizeNumber(handle)

    if (!ScreeningPrefs.shouldBlock(applicationContext, phone)) {
      respondToCall(callDetails, CallResponse.Builder().build())
      return
    }

    val hasMessage = applicationContext
      .getSharedPreferences("teloscope_screening", MODE_PRIVATE)
      .getString("message_path", null)
      ?.isNotBlank() == true

    val reason = if (hasMessage) {
      "Appel commercial coupé — message enregistré associé"
    } else {
      "Appel commercial coupé — liste Teloscope"
    }

    ScreeningPrefs.logBlock(applicationContext, phone, reason)

    val response = CallResponse.Builder()
      .setDisallowCall(true)
      .setRejectCall(true)
      .setSilenceCall(true)
      .build()

    respondToCall(callDetails, response)
  }
}
