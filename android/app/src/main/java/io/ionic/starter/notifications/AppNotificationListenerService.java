package io.ionic.starter.notifications;

import android.app.Notification;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Service que escuta notificações de outros apps
 * Requer permissão BIND_NOTIFICATION_LISTENER_SERVICE
 */
public class AppNotificationListenerService extends NotificationListenerService {
    private static final String TAG = "NotificationListener";
    public static final String ACTION_NOTIFICATION_RECEIVED = "io.ionic.starter.NOTIFICATION_RECEIVED";
    public static final String EXTRA_NOTIFICATION_DATA = "notification_data";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        super.onNotificationPosted(sbn);

        try {
            Log.d(TAG, "Nova notificação recebida de: " + sbn.getPackageName());

            // Extrair dados da notificação
            JSONObject notificationData = extractNotificationData(sbn);

            // Broadcast para o app
            Intent intent = new Intent(ACTION_NOTIFICATION_RECEIVED);
            intent.putExtra(EXTRA_NOTIFICATION_DATA, notificationData.toString());
            sendBroadcast(intent);

            Log.d(TAG, "Notificação broadcast enviado: " + notificationData.toString());

        } catch (Exception e) {
            Log.e(TAG, "Erro ao processar notificação", e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        super.onNotificationRemoved(sbn);
        Log.d(TAG, "Notificação removida de: " + sbn.getPackageName());
    }

    /**
     * Extrai dados relevantes da notificação
     */
    private JSONObject extractNotificationData(StatusBarNotification sbn) throws JSONException {
        JSONObject data = new JSONObject();

        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;

        // Informações básicas
        data.put("id", sbn.getId());
        data.put("packageName", sbn.getPackageName());
        data.put("postTime", sbn.getPostTime());
        data.put("key", sbn.getKey());

        // App que enviou
        try {
            String appName = getPackageManager()
                .getApplicationLabel(getPackageManager()
                .getApplicationInfo(sbn.getPackageName(), 0))
                .toString();
            data.put("appName", appName);
        } catch (Exception e) {
            data.put("appName", sbn.getPackageName());
        }

        // Conteúdo da notificação
        if (extras != null) {
            CharSequence title = extras.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence text = extras.getCharSequence(Notification.EXTRA_TEXT);
            CharSequence subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);
            CharSequence bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

            if (title != null) {
                data.put("title", title.toString());
            }
            if (text != null) {
                data.put("text", text.toString());
            }
            if (subText != null) {
                data.put("subText", subText.toString());
            }
            if (bigText != null) {
                data.put("bigText", bigText.toString());
            }

            // Informações adicionais
            data.put("category", notification.category);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                data.put("channelId", notification.getChannelId());
            }
        }

        return data;
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        Log.d(TAG, "Notification Listener conectado");
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        Log.d(TAG, "Notification Listener desconectado");
    }
}
