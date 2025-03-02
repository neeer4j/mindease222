package com.mindease.app;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.RelativeLayout;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private View splashView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Install but immediately disable the Android 12+ splash screen
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> false);
        splashScreen.setOnExitAnimationListener(view -> {
            view.remove();
        });
        
        // Ensure we have a pure black background with hidden system bars
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        
        // Create our activity
        super.onCreate(savedInstanceState);
        
        // Hide the system UI completely 
        hideSystemUI(this);
        
        // Inflate and add our custom splash screen with MINDEASE text
        splashView = getLayoutInflater().inflate(R.layout.splash_layout, null);
        addContentView(splashView, new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        
        // After a delay, remove the splash screen and switch to the main app theme
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            // Switch to the regular app theme
            setTheme(R.style.AppTheme_NoActionBar);
            
            // Remove the splash view
            if (splashView != null && splashView.getParent() != null) {
                ((ViewGroup) splashView.getParent()).removeView(splashView);
                splashView = null;
            }
            
            // Force a redraw of the window after theme change
            View rootView = getWindow().getDecorView().findViewById(android.R.id.content);
            if (rootView != null) {
                rootView.invalidate();
            }
        }, 2000); // Show splash for 2 seconds
    }
    
    // Helper method to completely hide the system UI
    private void hideSystemUI(Activity activity) {
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(
            activity.getWindow(), 
            activity.getWindow().getDecorView()
        );
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
    }
}
