package com.missclick.sadikoi;

import android.graphics.Color;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // The page goes under the status and navigation bars on every Android version, not only 15+.
        // Before Android 15 the bars were opaque and the page sat between them, but Capacitor still
        // passed their height to the CSS (--safe-*): the space was counted twice (empty band under
        // the bottom menu bar on phones with the 3-button bar).
        // Light bars (the app is light); Capacitor's SystemBars sets the icon color right after.
        EdgeToEdge.enable(
            this,
            SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
            // Android 7 can't draw dark navigation icons: a dark scrim keeps its white ones visible.
            SystemBarStyle.light(Color.TRANSPARENT, Color.argb(0x80, 0x1b, 0x1b, 0x1b))
        );
    }
}
