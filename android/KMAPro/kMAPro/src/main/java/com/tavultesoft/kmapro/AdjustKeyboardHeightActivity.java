/**
 * Copyright (C) 2021 SIL International. All rights reserved.
 */

package com.tavultesoft.kmapro;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.keyman.engine.KMManager;

/**
 * Activity that allows the user to adjust the keyboard height by dragging a resize bar.
 */
public class AdjustKeyboardHeightActivity extends AppCompatActivity {

    private static final String TAG = "AdjustKBHeight";

    // Min/Max height constraints (in dp)
    private static final int MIN_KEYBOARD_HEIGHT_DP = 150;
    private static final int MAX_KEYBOARD_HEIGHT_DP = 400;

    private View keyboardPreview;
    private View resizeBar;
    private TextView heightLabel;
    private Button resetButton;

    private int screenHeight;
    private int minKeyboardHeight;
    private int maxKeyboardHeight;
    private int defaultKeyboardHeight;
    private int currentKeyboardHeight;

    private float density;
    private float initialY;
    private int initialHeight;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_adjust_keyboard_height);

        // Setup toolbar
        Toolbar toolbar = findViewById(R.id.adjust_keyboard_height_toolbar);
        toolbar.setTitleTextColor(getResources().getColor(android.R.color.white));
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
            getSupportActionBar().setDisplayShowTitleEnabled(true);
            getSupportActionBar().setTitle(R.string.adjust_keyboard_height);
        }

        // Initialize views
        keyboardPreview = findViewById(R.id.keyboard_preview);
        resizeBar = findViewById(R.id.resize_bar);
        heightLabel = findViewById(R.id.height_label);
        resetButton = findViewById(R.id.reset_button);

        // Calculate dimensions
        DisplayMetrics displayMetrics = new DisplayMetrics();
        getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);
        screenHeight = displayMetrics.heightPixels;
        density = displayMetrics.density;

        minKeyboardHeight = (int) (MIN_KEYBOARD_HEIGHT_DP * density);
        maxKeyboardHeight = (int) (MAX_KEYBOARD_HEIGHT_DP * density);
        defaultKeyboardHeight = (int) getResources().getDimension(R.dimen.keyboard_height);

        // Load saved height or use default
        currentKeyboardHeight = getKeyboardHeight(this);
        if (currentKeyboardHeight <= 0) {
            currentKeyboardHeight = defaultKeyboardHeight;
        }

        // Ensure within bounds
        currentKeyboardHeight = Math.max(minKeyboardHeight, Math.min(maxKeyboardHeight, currentKeyboardHeight));

        updateKeyboardPreviewHeight(currentKeyboardHeight);

        // Setup touch listener for resize bar
        resizeBar.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialY = event.getRawY();
                        initialHeight = currentKeyboardHeight;
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        float deltaY = initialY - event.getRawY();
                        int newHeight = (int) (initialHeight + deltaY);

                        // Constrain to min/max bounds
                        newHeight = Math.max(minKeyboardHeight, Math.min(maxKeyboardHeight, newHeight));

                        currentKeyboardHeight = newHeight;
                        updateKeyboardPreviewHeight(newHeight);
                        return true;

                    case MotionEvent.ACTION_UP:
                        // Save the height when user releases
                        saveKeyboardHeight(AdjustKeyboardHeightActivity.this, currentKeyboardHeight);
                        return true;
                }
                return false;
            }
        });

        // Setup reset button
        resetButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                currentKeyboardHeight = defaultKeyboardHeight;
                updateKeyboardPreviewHeight(currentKeyboardHeight);
                saveKeyboardHeight(AdjustKeyboardHeightActivity.this, currentKeyboardHeight);
            }
        });
    }

    private void updateKeyboardPreviewHeight(int height) {
        RelativeLayout.LayoutParams params = (RelativeLayout.LayoutParams) keyboardPreview.getLayoutParams();
        params.height = height;
        keyboardPreview.setLayoutParams(params);

        // Update height label (convert to dp for display)
        int heightDp = (int) (height / density);
        heightLabel.setText(getString(R.string.keyboard_height_value, heightDp));
    }

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }

    /**
     * Get the saved keyboard height for the current orientation.
     * @param context The context
     * @return The saved keyboard height in pixels, or -1 if not set
     */
    public static int getKeyboardHeight(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(
            context.getString(R.string.kma_prefs_name), Context.MODE_PRIVATE);

        String key = isPortrait(context) ? KMManager.PREF_KEYBOARD_HEIGHT_PORTRAIT : KMManager.PREF_KEYBOARD_HEIGHT_LANDSCAPE;
        return prefs.getInt(key, -1);
    }

    /**
     * Save the keyboard height for the current orientation.
     * @param context The context
     * @param height The height in pixels to save
     */
    public static void saveKeyboardHeight(Context context, int height) {
        SharedPreferences prefs = context.getSharedPreferences(
            context.getString(R.string.kma_prefs_name), Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        String key = isPortrait(context) ? KMManager.PREF_KEYBOARD_HEIGHT_PORTRAIT : KMManager.PREF_KEYBOARD_HEIGHT_LANDSCAPE;
        editor.putInt(key, height);
        editor.apply();
    }

    /**
     * Check if the device is in portrait orientation.
     * @param context The context
     * @return true if portrait, false if landscape
     */
    private static boolean isPortrait(Context context) {
        WindowManager windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        DisplayMetrics displayMetrics = new DisplayMetrics();
        windowManager.getDefaultDisplay().getMetrics(displayMetrics);
        return displayMetrics.heightPixels > displayMetrics.widthPixels;
    }

    /**
     * Reset the keyboard height to default for both orientations.
     * @param context The context
     */
    public static void resetKeyboardHeight(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(
            context.getString(R.string.kma_prefs_name), Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.remove(KMManager.PREF_KEYBOARD_HEIGHT_PORTRAIT);
        editor.remove(KMManager.PREF_KEYBOARD_HEIGHT_LANDSCAPE);
        editor.apply();
    }
}