import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";
import type {
  WhatsAppLinksList,
  WhatsAppPairingCode,
  WhatsAppVerifyConfirmResult,
  WhatsAppVerifyStartResult,
} from "@/types/platform";

/**
 * WhatsApp Service
 *
 * Thin translation layer over the Gateway's /whatsapp endpoints, same
 * shape as provider.service.ts. Backs Settings -> WhatsApp: the
 * primary flow is verifyStart/verifyConfirm (user types their number,
 * gets a code, confirms it); createPairingCode is kept for the
 * "message us first" fallback.
 */
export const whatsappService = {
  async list<T = WhatsAppLinksList>(): Promise<T> {
    return gateway.get<T>(endpoints.whatsapp);
  },
  async createPairingCode<T = WhatsAppPairingCode>(): Promise<T> {
    return gateway.post<T>(endpoints.whatsapp, {});
  },
  async disconnect<T = unknown>(id: string): Promise<T> {
    return gateway.post<T>(endpoints.whatsappDisconnect, { id });
  },
  async verifyStart<T = WhatsAppVerifyStartResult>(phoneNumber: string): Promise<T> {
    return gateway.post<T>(endpoints.whatsappVerifyStart, { phone_number: phoneNumber });
  },
  async verifyConfirm<T = WhatsAppVerifyConfirmResult>(
    phoneNumber: string,
    code: string,
  ): Promise<T> {
    return gateway.post<T>(endpoints.whatsappVerifyConfirm, {
      phone_number: phoneNumber,
      code,
    });
  },
};
