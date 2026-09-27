package com.adam.aiagent;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.webkit.JavascriptInterface;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 4201;
    private static final int GOOGLE_SIGN_IN_REQUEST_CODE = 4202;

    private GoogleSignInClient googleSignInClient;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getBridge().getWebView().addJavascriptInterface(new AndroidAppBridge(), "AndroidApp");
    }

    private final class AndroidAppBridge {
        @JavascriptInterface
        public boolean hasOverlayPermission() {
            return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(MainActivity.this);
        }

        @JavascriptInterface
        public void requestOverlayPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(MainActivity.this)) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            }
        }

        @JavascriptInterface
        public void requestAllPermissions() {
            requestRuntimePermissions();
        }

        @JavascriptInterface
        public void requestIgnoreBattery() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                    try {
                        Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                                Uri.parse("package:" + getPackageName()));
                        startActivity(intent);
                    } catch (Exception ignored) {
                        openAppSettings();
                    }
                }
            }
        }

        @JavascriptInterface
        public void openAppSettings() {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:" + getPackageName()));
            startActivity(intent);
        }

        @JavascriptInterface
        public String getPackageNameString() {
            return getPackageName();
        }

        @JavascriptInterface
        public void signInWithGoogle(String serverClientId) {
            runOnUiThread(() -> startGoogleSignIn(serverClientId));
        }

        @JavascriptInterface
        public void signOutGoogle() {
            if (googleSignInClient != null) {
                googleSignInClient.signOut();
            }
        }
    }

    private void requestRuntimePermissions() {
        List<String> requested = new ArrayList<>();
        addIfMissing(requested, Manifest.permission.CAMERA);
        addIfMissing(requested, Manifest.permission.RECORD_AUDIO);
        addIfMissing(requested, Manifest.permission.ACCESS_FINE_LOCATION);
        addIfMissing(requested, Manifest.permission.ACCESS_COARSE_LOCATION);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            addIfMissing(requested, Manifest.permission.POST_NOTIFICATIONS);
            addIfMissing(requested, Manifest.permission.READ_MEDIA_IMAGES);
            addIfMissing(requested, Manifest.permission.READ_MEDIA_VIDEO);
            addIfMissing(requested, Manifest.permission.READ_MEDIA_AUDIO);
        } else {
            addIfMissing(requested, Manifest.permission.READ_EXTERNAL_STORAGE);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            addIfMissing(requested, Manifest.permission.BLUETOOTH_CONNECT);
            addIfMissing(requested, Manifest.permission.BLUETOOTH_SCAN);
        } else {
            addIfMissing(requested, Manifest.permission.BLUETOOTH);
        }

        if (!requested.isEmpty()) {
            ActivityCompat.requestPermissions(
                    this,
                    requested.toArray(new String[0]),
                    PERMISSION_REQUEST_CODE
            );
        }
    }

    private void addIfMissing(List<String> target, String permission) {
        if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
            target.add(permission);
        }
    }

    private void startGoogleSignIn(String serverClientId) {
        if (serverClientId == null || serverClientId.trim().isEmpty()) {
            sendGoogleError("MISSING_SERVER_CLIENT_ID");
            return;
        }

        GoogleSignInOptions options = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestIdToken(serverClientId.trim())
                .build();

        googleSignInClient = GoogleSignIn.getClient(this, options);
        startActivityForResult(googleSignInClient.getSignInIntent(), GOOGLE_SIGN_IN_REQUEST_CODE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != GOOGLE_SIGN_IN_REQUEST_CODE) return;

        try {
            GoogleSignInAccount account = GoogleSignIn.getSignedInAccountFromIntent(data)
                    .getResult(ApiException.class);

            JSONObject payload = new JSONObject();
            payload.put("uid", account.getId() == null ? "" : account.getId());
            payload.put("email", account.getEmail());
            payload.put("displayName", account.getDisplayName());
            payload.put("photoURL", account.getPhotoUrl() == null ? JSONObject.NULL : account.getPhotoUrl().toString());
            payload.put("idToken", account.getIdToken());
            payload.put("serverAuthCode", account.getServerAuthCode());

            runJavascriptCallback("onAndroidGoogleSignIn", payload.toString());
        } catch (ApiException e) {
            sendGoogleError("GOOGLE_SIGN_IN_FAILED:" + e.getStatusCode());
        } catch (Exception e) {
            sendGoogleError("GOOGLE_SIGN_IN_FAILED");
        }
    }

    private void sendGoogleError(String message) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("error", message);
            runJavascriptCallback("onAndroidGoogleSignInError", payload.toString());
        } catch (Exception ignored) {
            runJavascriptCallback("onAndroidGoogleSignInError", "{\"error\":\"GOOGLE_SIGN_IN_FAILED\"}");
        }
    }

    private void runJavascriptCallback(String callback, String json) {
        String escaped = JSONObject.quote(json);
        getBridge().getWebView().post(() ->
                getBridge().getWebView().evaluateJavascript(
                        "window." + callback + "(" + escaped + ")", null
                )
        );
    }
}