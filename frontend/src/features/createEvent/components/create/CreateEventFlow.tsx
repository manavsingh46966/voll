import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import { colors } from "@/constants/theme";
import { ActionModal } from "@/src/components/ui/ActionModal";

import { createEventApi } from "../../api/event.api";
import { useCreateEventStore } from "../../stores/createEvent.store";
import {
  deriveEventCapacity,
  hasCompleteSlotSkillGroups,
} from "../../utils/capacity";

import { Step1BasicInfo } from "./Step1BasicInfo";
import { Step2DateTime } from "./Step2DateTime";
import { Step3Participation } from "./Step3Participation";
import { Step4Visibility } from "./Step4Visibility";

/**
 * The array of step indices represented in the create event form flow.
 */
const STEPS = [1, 2, 3, 4];

/**
 * Readable header titles mapping to each index of the create event wizard flow.
 */
const STEP_TITLES = [
  "Basic Info",
  "Date & Time",
  "Participation",
  "Visibility",
];

/**
 * Safe helper to extract and parse the error message returned from the create event API.
 * Inspects Axios error responses for detailed backend error messages.
 *
 * @param {unknown} error The error object caught during the creation request.
 * @returns {string} The resolved error message suitable for user display.
 */
function getCreateEventErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return "Failed to create event. Please try again.";
}

/**
 * CreateEventFlow acts as the multi-step form wizard controller.
 * It manages transitions, page animations, progress indicators, form validations per step,
 * and submits the final payload to the server.
 *
 * Navigation is state-driven by the global Zustand store (`useCreateEventStore`).
 * Transitions between steps are animated using horizontal slide translations.
 *
 * @returns {React.JSX.Element} A KeyboardAvoidingView wrapper for the multi-step event creation wizard.
 */
export function CreateEventFlow() {
  const {
    step,
    nextStep,
    prevStep,
    formData,
    clearDraft,
    isSubmitting,
    setIsSubmitting,
    hydrate,
  } = useCreateEventStore();

  const anim = useRef(new Animated.Value(1)).current;
  const dirRef = useRef<"forward" | "backward">("forward");
  const prevStepRef = useRef(step);

  const stepAnimRefs = useRef(
    STEPS.map((s) => new Animated.Value(step >= s ? 1 : 0)),
  ).current;

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    const prev = prevStepRef.current;
    if (prev !== step) {
      dirRef.current = prev < step ? "forward" : "backward";
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      anim.setValue(1);
    }
    prevStepRef.current = step;
  }, [step]);

  useEffect(() => {
    Animated.parallel(
      stepAnimRefs.map((av, i) =>
        Animated.timing(av, {
          toValue: step >= STEPS[i] ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [step]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (step > 1) {
        prevStep();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: dirRef.current === "forward" ? [32, 0] : [-32, 0],
  });

  /**
   * Memoized boolean that evaluates whether the current step is valid and can transition forward.
   *
   * Validation Rules:
   * - Step 1 (Basic Info): Requires title, category, and description text length >= 100.
   * - Step 2 (Date & Time): Requires start and end dates.
   * - Step 3 (Participation): Requires maxParticipants > 0, at least one skill, and complete timeslots.
   * - Step 4 (Visibility): Requires visibility. If 'groups_only', requires at least one allowed group selected.
   */
  const canContinue = useMemo(() => {
    const derivedCapacity = deriveEventCapacity(formData);
    switch (step) {
      case 1:
        return (
          formData.title.trim().length > 0 &&
          formData.description.trim().length >= 100 &&
          formData.category.trim().length > 0
        );
      case 2:
        return !!formData.startDate && !!formData.endDate;
      case 3: {
        const effectiveMax =
          formData.maxParticipants > 0
            ? formData.maxParticipants
            : derivedCapacity.maxParticipants;
        const effectiveSkills = [
          ...new Set([...(formData.skills ?? []), ...derivedCapacity.skills]),
        ];
        return (
          effectiveMax > 0 &&
          effectiveSkills.length > 0 &&
          hasCompleteSlotSkillGroups(formData)
        );
      }
      case 4:
        if (
          formData.visibility === "groups_only" &&
          formData.allowedGroups.length === 0
        ) {
          return false;
        }
        return !!formData.visibility;
      default:
        return false;
    }
  }, [step, formData]);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    isSuccess: boolean;
  } | null>(null);

  /**
   * Finalizes the creation process by sending the store's form data payload to the backend.
   * On success, clears the draft store state and routes the user back to the home page feed.
   *
   * @returns {Promise<void>} Resolves when the submission request completes.
   */
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createEventApi(formData);
      clearDraft();
      setModalConfig({
        visible: true,
        title: "Submitted for Review!",
        message:
          "Your event has been submitted and will appear on the feed once approved by an admin.",
        isSuccess: true,
      });
    } catch (error) {
      setModalConfig({
        visible: true,
        title: "Unable to Create Event",
        message: getCreateEventErrorMessage(error),
        isSuccess: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Button handler called when the user presses the main CTA.
   * Navigates to the next page of the wizard, or calls `handleSubmit` if on the last page.
   *
   * @returns {void}
   */
  const handleContinue = () => {
    if (step < 4) {
      nextStep();
    } else {
      handleSubmit();
    }
  };

  /**
   * Component dictionary mapping step indices to their respective subcomponent steps.
   */
  const steps: Record<number, React.ReactNode> = {
    1: <Step1BasicInfo />,
    2: <Step2DateTime />,
    3: <Step3Participation />,
    4: <Step4Visibility />,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-white">
        <View className="flex-row items-center border-b border-neutral-lightest px-4 py-3">
          <Text className="mr-3 font-nunito text-[13px] text-primary">
            Step {step}/{STEPS.length}
          </Text>
          {STEPS.map((s, i) => {
            const overlayOpacity = stepAnimRefs[i];
            return (
              <View
                key={s}
                className="mx-1 h-1 flex-1 overflow-hidden rounded-full bg-neutral-lightest"
              >
                <Animated.View
                  pointerEvents="none"
                  style={{
                    ...{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 3,
                      backgroundColor: colors.primary.DEFAULT,
                    },
                    opacity: overlayOpacity,
                  }}
                />
              </View>
            );
          })}
          <Text className="ml-3 font-nunito text-[12px] text-neutral-light">
            {STEP_TITLES[step - 1]}
          </Text>
        </View>

        <Animated.View
          style={{ flex: 1, transform: [{ translateX }], opacity: anim }}
        >
          {steps[step]}
        </Animated.View>

        <View className="border-t border-neutral-lightest px-4 py-4">
          <TouchableOpacity
            accessibilityRole="button"
            className={`items-center rounded-2xl py-4 ${canContinue && !isSubmitting ? "bg-primary" : "bg-neutral-lightest"}`}
            onPress={handleContinue}
            disabled={!canContinue || isSubmitting}
            activeOpacity={0.85}
          >
            <Text
              className={`font-nunito-bold text-[16px] ${canContinue && !isSubmitting ? "text-white" : "text-neutral-light"}`}
            >
              {isSubmitting
                ? "Creating..."
                : step < 4
                  ? "Continue"
                  : "Create Event"}
            </Text>
          </TouchableOpacity>
        </View>

        <ActionModal
          visible={!!modalConfig?.visible}
          title={modalConfig?.title ?? ""}
          message={modalConfig?.message ?? ""}
          actionLabel={modalConfig?.isSuccess ? "Go to Home" : "OK"}
          onAction={() => {
            const isSuccess = modalConfig?.isSuccess;
            setModalConfig(null);
            if (isSuccess) {
              router.replace("/(drawer)/(tabs)/home");
            }
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
