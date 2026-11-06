package com.organizador.escolar.widgets;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Plugin de Capacitor para sincronización bidireccional entre la Web App
 * y los Widgets Nativos de escritorio en Android.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void updateWidgets(PluginCall call) {
        String jsonPayload = call.getString("json");
        if (jsonPayload != null && !jsonPayload.isEmpty()) {
            WidgetDataSync.savePayload(getContext(), jsonPayload);
            WidgetDataSync.updateAllWidgets(getContext());
            call.resolve();
        } else {
            call.reject("Payload JSON vacío o inválido");
        }
    }

    @PluginMethod
    public void getWidgetData(PluginCall call) {
        String data = WidgetDataSync.getPayload(getContext());
        if (data != null) {
            com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
            ret.put("payload", data);
            call.resolve(ret);
        } else {
            call.resolve();
        }
    }
}
