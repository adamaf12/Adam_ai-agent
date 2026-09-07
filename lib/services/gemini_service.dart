import 'dart:async';
import 'dart:io';
import 'package:google_generative_ai/google_generative_ai.dart';

/// Senior Flutter & Gemini Service
/// Handles Gemini API streaming and unary requests with robust timeout management,
/// safe stream parsing, and comprehensive exception handling (TimeoutException,
/// SocketException, GenerativeAIException) to prevent UI engine connection drops.
class GeminiService {
  final GenerativeModel _model;
  final Duration defaultTimeout;

  GeminiService({
    required String apiKey,
    String modelName = 'gemini-1.5-flash',
    List<SafetySetting>? safetySettings,
    GenerationConfig? generationConfig,
    this.defaultTimeout = const Duration(seconds: 45),
  }) : _model = GenerativeModel(
          model: modelName,
          apiKey: apiKey,
          safetySettings: safetySettings,
          generationConfig: generationConfig,
        );

  /// Safely streams chat response chunks with timeout protection, null-checks,
  /// and exception handling to maintain engine stability.
  Stream<String> generateContentStreamSafe(
    List<Content> contents, {
    Duration? timeout,
  }) async* {
    final effectiveTimeout = timeout ?? defaultTimeout;

    try {
      final Stream<GenerateContentResponse> stream = _model
          .generateContentStream(contents)
          .timeout(
            effectiveTimeout,
            onTimeout: (EventSink<GenerateContentResponse> sink) {
              sink.addError(
                TimeoutException('انتهت مهلة انتظار إجابة المحرك (Timeout).'),
              );
              sink.close();
            },
          );

      await for (final chunk in stream) {
        // 1. Safe Stream Parsing: check prompt feedback blockings
        if (chunk.promptFeedback?.blockReason != null) {
          throw GenerativeAIException(
            'تم توقف الإجابة من المحرك بسبب معايير الأمان: ${chunk.promptFeedback?.blockReason}',
          );
        }

        // 2. Safe chunk.text parsing: verify non-null and non-empty
        final text = chunk.text;
        if (text != null && text.isNotEmpty) {
          yield text;
        }

        // 3. Handle candidate finish reasons safely
        if (chunk.candidates.isNotEmpty) {
          final candidate = chunk.candidates.first;
          if (candidate.finishReason == FinishReason.safety ||
              candidate.finishReason == FinishReason.recitation) {
            // Log/Handle finish reason without throwing unhandled crash
            break;
          }
        }
      }
    } on TimeoutException catch (e) {
      // Handled TimeoutException
      throw Exception('لم تصل إجابة - انتهت مهلة الاتصال بالذكاء الاصطناعي ($e).');
    } on SocketException catch (e) {
      // Handled SocketException (network disconnection)
      throw Exception('حدث انقطاع في الاتصال بالشبكة ($e). سيعاد توجيه الطلب عند المحاولة التالية.');
    } on GenerativeAIException catch (e) {
      // Handled Gemini GenerativeAIException
      throw Exception('حدث انقطاع في المحرك. خطأ في النموذج ($e).');
    } catch (e) {
      // Catch-all to prevent UI engine crash
      throw Exception('حدث انقطاع في المحرك. سيعاد توجيه الطلب عند المحاولة التالية. ($e)');
    }
  }

  /// Non-streaming content generation with full timeout and exception protection.
  Future<String?> generateContentSafe(
    List<Content> contents, {
    Duration? timeout,
  }) async {
    final effectiveTimeout = timeout ?? defaultTimeout;

    try {
      final response = await _model
          .generateContent(contents)
          .timeout(effectiveTimeout);

      if (response.promptFeedback?.blockReason != null) {
        throw GenerativeAIException(
          'تم حظر الطلب من المحرك لعدم التوافق مع قواعد الأمان: ${response.promptFeedback?.blockReason}',
        );
      }

      final text = response.text;
      if (text != null && text.isNotEmpty) {
        return text;
      }
      return null;
    } on TimeoutException catch (e) {
      throw Exception('لم تصل إجابة - انتهت مهلة الانتظار ($e).');
    } on SocketException catch (e) {
      throw Exception('حدث انقطاع في الاتصال بالشبكة ($e).');
    } on GenerativeAIException catch (e) {
      throw Exception('حدث انقطاع في المحرك ($e).');
    } catch (e) {
      throw Exception('حدث انقطاع في المحرك. سيعاد توجيه الطلب عند المحاولة التالية. ($e)');
    }
  }
}
