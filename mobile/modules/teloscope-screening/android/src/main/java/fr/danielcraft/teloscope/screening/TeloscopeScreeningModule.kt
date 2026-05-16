package fr.danielcraft.teloscope.screening

import android.app.role.RoleManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class SyncRulesRecord : Record {
  @Field var enabled: Boolean = false
  @Field var commercialNumbers: List<String> = emptyList()
  @Field var spamThreshold: Int = 70
  @Field var messagePath: String? = null
}

class TeloscopeScreeningModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TeloscopeScreening")

    Function("isAvailable") {
      true
    }

    AsyncFunction("hasCallScreeningRole") {
      val activity = appContext.currentActivity ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val roleManager = activity.getSystemService(RoleManager::class.java)
        return@AsyncFunction roleManager.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)
      }
      false
    }

    AsyncFunction("requestCallScreeningRole") {
      val activity = appContext.currentActivity ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val roleManager = activity.getSystemService(RoleManager::class.java)
        if (roleManager.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
          if (roleManager.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) {
            return@AsyncFunction true
          }
          val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)
          activity.startActivity(intent)
        }
      }
      false
    }

    AsyncFunction("syncRules") { rules: SyncRulesRecord ->
      val ctx = appContext.reactContext ?: return@AsyncFunction
      ScreeningPrefs.sync(
        ctx,
        rules.enabled,
        rules.commercialNumbers,
        rules.spamThreshold,
        rules.messagePath
      )
    }

    AsyncFunction("getBlockedCalls") {
      val ctx = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, String>>()
      val arr = ScreeningPrefs.getBlockedCalls(ctx)
      val list = mutableListOf<Map<String, String>>()
      for (i in 0 until arr.length()) {
        val o = arr.getJSONObject(i)
        list.add(
          mapOf(
            "id" to o.optString("id", ""),
            "phone" to o.optString("phone", ""),
            "at" to o.optString("at", ""),
            "reason" to o.optString("reason", "")
          )
        )
      }
      list
    }
  }
}
