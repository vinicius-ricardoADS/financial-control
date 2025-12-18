package io.ionic.starter.notifications;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Plugin Capacitor para escutar notificações de outros apps
 */
@CapacitorPlugin(name = "NotificationListener")
public class NotificationListenerPlugin extends Plugin {
    private static final String TAG = "NotificationListenerPlugin";
    private BroadcastReceiver notificationReceiver;

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "Plugin NotificationListener carregado");
        registerNotificationReceiver();
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (notificationReceiver != null) {
            getContext().unregisterReceiver(notificationReceiver);
        }
    }

    /**
     * Registra o BroadcastReceiver para receber notificações
     */
    private void registerNotificationReceiver() {
        notificationReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (AppNotificationListenerService.ACTION_NOTIFICATION_RECEIVED.equals(intent.getAction())) {
                    String notificationDataJson = intent.getStringExtra(AppNotificationListenerService.EXTRA_NOTIFICATION_DATA);

                    try {
                        JSONObject notificationData = new JSONObject(notificationDataJson);
                        JSObject jsObject = JSObject.fromJSONObject(notificationData);

                        // Notificar listeners JavaScript
                        notifyListeners("notificationReceived", jsObject);

                        Log.d(TAG, "Notificação enviada para JavaScript: " + jsObject.toString());
                    } catch (JSONException e) {
                        Log.e(TAG, "Erro ao converter notificação para JS", e);
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter(AppNotificationListenerService.ACTION_NOTIFICATION_RECEIVED);
        getContext().registerReceiver(notificationReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        Log.d(TAG, "BroadcastReceiver registrado");
    }

    /**
     * Verifica se o app tem permissão de Notification Listener
     */
    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean hasPermission = isNotificationServiceEnabled();
        JSObject result = new JSObject();
        result.put("granted", hasPermission);
        call.resolve(result);
    }

    /**
     * Abre as configurações para o usuário conceder permissão
     */
    @PluginMethod
    public void requestPermission(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            getActivity().startActivity(intent);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Configurações abertas. Por favor, habilite o acesso às notificações.");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Erro ao abrir configurações", e);
            call.reject("Erro ao abrir configurações: " + e.getMessage());
        }
    }

    /**
     * Verifica se o serviço de notificação está habilitado
     */
    private boolean isNotificationServiceEnabled() {
        String packageName = getContext().getPackageName();
        String flat = Settings.Secure.getString(
            getContext().getContentResolver(),
            "enabled_notification_listeners"
        );

        if (!TextUtils.isEmpty(flat)) {
            String[] names = flat.split(":");
            for (String name : names) {
                if (name.contains(packageName)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Retorna o status do serviço
     */
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", isNotificationServiceEnabled());
        result.put("serviceName", AppNotificationListenerService.class.getName());
        call.resolve(result);
    }
}
