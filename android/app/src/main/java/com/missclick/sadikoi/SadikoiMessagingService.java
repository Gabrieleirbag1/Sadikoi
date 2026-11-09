package com.missclick.sadikoi;

import android.app.NotificationManager;
import androidx.annotation.NonNull;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * Takes the place of Capacitor's Firebase service (see AndroidManifest.xml) to handle "dismiss" messages here:
 * the API sends them when a group is seen on another device (the website, another phone), and they must work
 * while the app is closed, when no page is running push.service.ts. Every other message goes to Capacitor as before.
 */
public class SadikoiMessagingService extends MessagingService {

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        if ("dismiss".equals(remoteMessage.getData().get("action"))) {
            dismiss(remoteMessage.getData().get("tags"));
            return;
        }
        super.onMessageReceived(remoteMessage);
    }

    /** Removes the notifications with these tags ("chat-12,answers-12") from the tray. */
    private void dismiss(String tags) {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (tags == null || manager == null) {
            return;
        }
        for (String tag : tags.split(",")) {
            if (tag.isEmpty()) {
                continue;
            }
            // Shown by Firebase (app closed or in the background): the API's tag, id 0.
            manager.cancel(tag, 0);
            // Shown by the app while open (showWhileOpen in push.service.ts): no tag, an id made from it
            // by notificationId(), the same computation as String.hashCode().
            manager.cancel(Math.abs(tag.hashCode()));
        }
    }
}
