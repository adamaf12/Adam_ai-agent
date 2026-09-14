/**
 * Unreal Engine 5 Bridge & Remote Control Integration Core
 * Supports:
 * 1. Web Remote Control REST & WebSockets API (UE5 / UE4)
 * 2. Pixel Streaming WebRTC Signaling Config
 * 3. Transpiler: Web Sandbox to Unreal Engine 5 C++ (Actor / Pawn) & Python Script
 * 4. Procedural Scene & Actor Control
 */

export interface UE5ConnectionConfig {
  httpHost: string;
  httpPort: number;
  wsPort: number;
  pixelStreamingUrl: string;
  authPassphrase?: string;
  connected: boolean;
  latencyMs?: number;
  engineVersion?: string;
  projectName?: string;
}

export const DEFAULT_UE5_CONFIG: UE5ConnectionConfig = {
  httpHost: 'http://localhost',
  httpPort: 30010,
  wsPort: 30020,
  pixelStreamingUrl: 'ws://localhost:8888',
  connected: false,
};

export interface UE5ActorSpawnPayload {
  className?: string;
  meshPath?: string;
  label: string;
  location: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  scale: { x: number; y: number; z: number };
  materialColor?: string;
}

export interface UE5LightingPayload {
  sunIntensity: number;
  sunPitch: number;
  sunYaw: number;
  skyLightColor: string;
  bloomIntensity: number;
  fogDensity: number;
}

export interface UE5RemoteCommandResult {
  success: boolean;
  message: string;
  response?: any;
  executionTimeMs?: number;
}

/**
 * Transpiles Sandbox Game logic to Unreal Engine 5 C++ Header (.h)
 */
export function generateUnrealCppHeader(appName: string, className = 'AAdamGameActor'): string {
  const safeName = className.replace(/[^a-zA-Z0-9_]/g, '');
  return `// Copyright (c) 2026 Adam Game Studio. All Rights Reserved.
// Generated automatically for Unreal Engine 5.4+

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/FloatingPawnMovement.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "Sound/SoundBase.h"
#include "${safeName}.generated.h"

UCLASS(Blueprintable, BlueprintType)
class YOURPROJECT_API ${safeName} : public APawn
{
	GENERATED_BODY()

public:
	// Sets default values for this pawn's properties
	${safeName}();

protected:
	// Called when the game starts or when spawned
	virtual void BeginPlay() override;

public:	
	// Called every frame
	virtual void Tick(float DeltaTime) override;

	// Called to bind functionality to input
	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

	// --- Visual & Physics Components ---
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Adam|Components")
	UStaticMeshComponent* ShipMeshComponent;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Adam|Components")
	USpringArmComponent* CameraBoom;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Adam|Components")
	UCameraComponent* FollowCamera;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Adam|Movement")
	UFloatingPawnMovement* MovementComponent;

	// --- Gameplay Variables ---
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Adam|Gameplay")
	float MoveSpeed;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Adam|Gameplay")
	float CurrentHealth;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Adam|Gameplay")
	float MaxHealth;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Adam|Gameplay")
	int32 PlayerScore;

	// --- Remote Control Callable Functions ---
	UFUNCTION(BlueprintCallable, Category = "Adam|RemoteControl")
	void RemoteFireLaser();

	UFUNCTION(BlueprintCallable, Category = "Adam|RemoteControl")
	void RemoteApplyDamage(float DamageAmount);

	UFUNCTION(BlueprintCallable, Category = "Adam|RemoteControl")
	void RemoteSetSpeed(float NewSpeed);

	UFUNCTION(BlueprintImplementableEvent, Category = "Adam|Events")
	void OnGameOverEvent();

	UFUNCTION(BlueprintImplementableEvent, Category = "Adam|Events")
	void OnScoreUpdated(int32 NewScore);
};
`;
}

/**
 * Transpiles Sandbox Game logic to Unreal Engine 5 C++ Source (.cpp)
 */
export function generateUnrealCppSource(appName: string, className = 'AAdamGameActor'): string {
  const safeName = className.replace(/[^a-zA-Z0-9_]/g, '');
  return `// Copyright (c) 2026 Adam Game Studio. All Rights Reserved.
// Generated automatically for Unreal Engine 5.4+

#include "${safeName}.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/World.h"

// Sets default values
${safeName}::${safeName}()
{
 	// Set this pawn to call Tick() every frame.
	PrimaryActorTick.bCanEverTick = true;

	// Create root mesh
	ShipMeshComponent = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("ShipMeshComponent"));
	RootComponent = ShipMeshComponent;
	ShipMeshComponent->SetSimulatePhysics(false);
	ShipMeshComponent->SetCollisionProfileName(TEXT("Pawn"));

	// Create Camera Boom
	CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
	CameraBoom->SetupAttachment(RootComponent);
	CameraBoom->TargetArmLength = 600.0f;
	CameraBoom->SetRelativeRotation(FRotator(-40.0f, 0.0f, 0.0f));
	CameraBoom->bDoCollisionTest = false;

	// Create Follow Camera
	FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));
	FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);

	// Movement component
	MovementComponent = CreateDefaultSubobject<UFloatingPawnMovement>(TEXT("MovementComponent"));
	MovementComponent->MaxSpeed = 1200.0f;
	MovementComponent->Acceleration = 4000.0f;
	MovementComponent->Deceleration = 4000.0f;

	// Gameplay stats
	MoveSpeed = 800.0f;
	MaxHealth = 100.0f;
	CurrentHealth = MaxHealth;
	PlayerScore = 0;
}

// Called when the game starts or when spawned
void ${safeName}::BeginPlay()
{
	Super::BeginPlay();
	CurrentHealth = MaxHealth;
	PlayerScore = 0;
	UE_LOG(LogTemp, Log, TEXT("[Adam Engine] ${safeName} Initialized in Unreal Engine 5"));
}

// Called every frame
void ${safeName}::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
}

// Called to bind functionality to input
void ${safeName}::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);
}

void ${safeName}::RemoteFireLaser()
{
	UE_LOG(LogTemp, Log, TEXT("[Adam Engine] Laser Fired via Remote Control API!"));
	// Spawn projectile or emit laser Niagara particle system here
}

void ${safeName}::RemoteApplyDamage(float DamageAmount)
{
	CurrentHealth = FMath::Clamp(CurrentHealth - DamageAmount, 0.0f, MaxHealth);
	UE_LOG(LogTemp, Warning, TEXT("[Adam Engine] Damage Applied: %f | Health: %f"), DamageAmount, CurrentHealth);
	
	if (CurrentHealth <= 0.0f)
	{
		OnGameOverEvent();
	}
}

void ${safeName}::RemoteSetSpeed(float NewSpeed)
{
	MoveSpeed = NewSpeed;
	if (MovementComponent)
	{
		MovementComponent->MaxSpeed = NewSpeed;
	}
}
`;
}

/**
 * Generates Unreal Engine Python Automation Script for Level Spawning & Setup
 */
export function generateUnrealPythonScript(appName: string, appCategory = 'game'): string {
  return `# ==============================================================================
# ADAM UNREAL ENGINE 5 AUTOMATION & SCENE BUILDER
# Description: Automated Python script for Unreal Engine 5 Editor
# Run via: Unreal Engine Editor -> Output Log (Cmd) -> Python -> py "script.py"
# Or via Web Remote Control API: POST /remote/preset/...
# ==============================================================================

import unreal

def build_adam_sandbox_scene():
    unreal.log("🚀 [Adam Engine] Starting Unreal Engine 5 Scene Generation for: ${appName}")

    editor_level_lib = unreal.EditorLevelLibrary()
    editor_asset_lib = unreal.EditorAssetLibrary()

    # 1. Spawn Sun & Directional Light
    sun_actor = editor_level_lib.spawn_actor_from_class(
        unreal.DirectionalLight,
        unreal.Vector(0, 0, 800),
        unreal.Rotator(-45, 30, 0)
    )
    if sun_actor:
        sun_actor.set_actor_label("Adam_SunLight")
        sun_light_comp = sun_actor.get_component_by_class(unreal.DirectionalLightComponent)
        if sun_light_comp:
            sun_light_comp.set_intensity(10.0)
            sun_light_comp.set_light_color(unreal.LinearColor(1.0, 0.95, 0.85, 1.0))
        unreal.log("☀️ Sun Light spawned successfully.")

    # 2. Spawn Sky Atmosphere & Exponential Height Fog
    sky_actor = editor_level_lib.spawn_actor_from_class(
        unreal.SkyAtmosphere,
        unreal.Vector(0, 0, 0),
        unreal.Rotator(0, 0, 0)
    )
    if sky_actor:
        sky_actor.set_actor_label("Adam_SkyAtmosphere")

    # 3. Spawn Cyber Ground / Platform
    ground_actor = editor_level_lib.spawn_actor_from_class(
        unreal.StaticMeshActor,
        unreal.Vector(0, 0, -20),
        unreal.Rotator(0, 0, 0)
    )
    if ground_actor:
        ground_actor.set_actor_label("Adam_BattleGrid")
        mesh_comp = ground_actor.get_component_by_class(unreal.StaticMeshComponent)
        if mesh_comp:
            cube_mesh = unreal.load_asset("/Engine/BasicShapes/Cube.Cube")
            if cube_mesh:
                mesh_comp.set_static_mesh(cube_mesh)
            ground_actor.set_actor_scale3d(unreal.Vector(50.0, 50.0, 0.2))
        unreal.log("🟦 Battle Arena Grid spawned.")

    # 4. Spawn Procedural Obstacles / Drones
    for i in range(8):
        pos_x = (i - 4) * 350 + 200
        pos_y = ((i % 3) - 1) * 400
        drone = editor_level_lib.spawn_actor_from_class(
            unreal.StaticMeshActor,
            unreal.Vector(pos_x, pos_y, 120),
            unreal.Rotator(0, i * 45, 0)
        )
        if drone:
            drone.set_actor_label(f"Adam_EnemyDrone_{i+1}")
            d_mesh = drone.get_component_by_class(unreal.StaticMeshComponent)
            if d_mesh:
                cone_mesh = unreal.load_asset("/Engine/BasicShapes/Cone.Cone")
                if cone_mesh:
                    d_mesh.set_static_mesh(cone_mesh)
            drone.set_actor_scale3d(unreal.Vector(1.5, 1.5, 1.5))

    unreal.log("✅ [Adam Engine] Unreal Engine 5 Scene built successfully! Ready for Play in Editor (PIE).")

if __name__ == "__main__":
    build_adam_sandbox_scene()
`;
}

/**
 * Generates Unreal Engine Remote Control JSON Preset
 */
export function generateUnrealRemoteControlPreset(appName: string): string {
  return JSON.stringify(
    {
      PresetName: `Adam_${appName.replace(/\s+/g, '_')}_Preset`,
      EngineVersion: '5.4.0',
      RemoteRoutes: [
        {
          Name: 'SpawnActor',
          Path: '/remote/object/call',
          Verb: 'PUT',
          Description: 'Spawns an Actor in the current UE5 World'
        },
        {
          Name: 'FireLaser',
          Path: '/remote/object/call',
          Verb: 'PUT',
          Target: 'AAdamGameActor',
          Function: 'RemoteFireLaser'
        },
        {
          Name: 'AdjustSunLight',
          Path: '/remote/object/property',
          Verb: 'PUT',
          Target: 'DirectionalLightComponent',
          Property: 'Intensity'
        },
        {
          Name: 'ExecutePython',
          Path: '/remote/preset/Adam_SceneBuilder/Execute',
          Verb: 'PUT'
        }
      ]
    },
    null,
    2
  );
}

/**
 * Sends a Remote Command to Unreal Engine via the Proxy/Direct REST API
 */
export async function sendCommandToUnreal(
  config: UE5ConnectionConfig,
  action: 'test_connection' | 'spawn_actor' | 'execute_python' | 'adjust_lighting' | 'fire_action',
  payload?: any
): Promise<UE5RemoteCommandResult> {
  const startTime = Date.now();
  try {
    const response = await fetch('/api/unreal-engine/bridge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: config.httpHost,
        port: config.httpPort,
        action,
        payload,
      }),
    });

    const data = await response.json();
    return {
      success: data.success || data.ok,
      message: data.message || (data.success ? 'Command executed successfully in Unreal Engine.' : 'Failed to execute command.'),
      response: data.data || data,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (err: any) {
    // Graceful fallback for local simulated execution if Unreal is not currently running locally
    return {
      success: false,
      message: `Could not reach Unreal Engine at ${config.httpHost}:${config.httpPort}. Please ensure the 'Web Remote Control' plugin is enabled in UE5.`,
      executionTimeMs: Date.now() - startTime,
    };
  }
}
