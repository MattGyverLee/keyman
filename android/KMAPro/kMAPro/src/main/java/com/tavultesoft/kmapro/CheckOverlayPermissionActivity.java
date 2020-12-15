/**
 * Copyright (C) 2020 SIL International. All rights reserved.
 */

package com.tavultesoft.kmapro;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class CheckOverlayPermissionActivity extends AppCompatActivity {
  private static final int ACTION_MANAGE_OVERLAY_PERMISSION_REQUEST_CODE = 2323;
  private static final String TAG = "CheckOverlay";

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
      Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName()));
      startActivityForResult(intent, ACTION_MANAGE_OVERLAY_PERMISSION_REQUEST_CODE);
    } else {
      finish();
    }
  }

  @Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    if (requestCode == ACTION_MANAGE_OVERLAY_PERMISSION_REQUEST_CODE) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Settings.canDrawOverlays(this)) {
        Log.d(TAG, "Overlay permission granted");
        //EventBus.getDefault().post(new CanDrawOverlaysEvent(true));
      } else {
        Log.d(TAG, "Overlay permission denied");
        //EventBus.getDefault().post(new CanDrawOverlaysEvent(false));
      }
      finish();
    }
  }

}
