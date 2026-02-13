import { PaymentPlan } from '@/common/enums';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { CarrierQuote } from '../carriers/entities/carrier-quote.entity';
import { BindPolicyDto } from '../policies/dto/bind-policy.dto';
import { PoliciesService } from '../policies/policies.service';
import {
  CheckoutSessionResponseDto,
  CreateCheckoutSessionDto,
} from './dto/create-checkout-session.dto';
import { randomUUID } from 'crypto';

/**
 * Interface for simulated checkout session responses
 */
export interface SimulatedCheckoutSession {
  id: string;
  object: 'checkout.session';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'complete' | 'expired' | 'open';
  mode: 'payment' | 'setup' | 'subscription';
  success_url: string;
  cancel_url: string;
  created: number;
  currency: string;
  livemode: boolean;
  metadata: Record<string, string>;
  amount_total: number;
  amount_subtotal: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;
  private readonly simulatePayments: boolean;

  constructor(
    private configService: ConfigService,
    @InjectRepository(CarrierQuote)
    private carrierQuotesRepository: Repository<CarrierQuote>,
    @Inject(forwardRef(() => PoliciesService))
    private policiesService: PoliciesService,
  ) {
    this.simulatePayments =
      this.configService.get<string>('SIMULATE_PAYMENTS') === 'true';

    if (this.simulatePayments) {
      this.logger.log('Payment simulation mode enabled');
    }

    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!stripeSecretKey && !this.simulatePayments) {
      this.logger.warn(
        'STRIPE_SECRET_KEY not configured. Payment features will be unavailable.',
      );
    }

    // Initialize Stripe (even in simulation mode for type safety)
    this.stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
      apiVersion: '2026-01-28.clover',
    });
  }

  /**
   * Create a Stripe Checkout session for purchasing a quote
   */
  async createCheckoutSession(
    dto: CreateCheckoutSessionDto,
    userId: string,
  ): Promise<CheckoutSessionResponseDto> {
    const {
      carrierQuoteId,
      successUrl = undefined,
      cancelUrl = undefined,
    } = dto;

    // Get the carrier quote
    const quote = await this.carrierQuotesRepository.findOne({
      where: { id: carrierQuoteId },
      relations: ['carrier'],
    });

    if (!quote) {
      throw new HttpException('Quote not found', HttpStatus.NOT_FOUND);
    }

    // Check if quote is still valid
    if (new Date() > quote.validUntil) {
      throw new HttpException('Quote has expired', HttpStatus.BAD_REQUEST);
    }

    // Get frontend URL from config
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';

    // Simulation mode - return simulated session without calling Stripe
    if (this.simulatePayments) {
      return this.createSimulatedCheckoutSession(
        carrierQuoteId,
        userId,
        quote,
        successUrl,
        cancelUrl,
        frontendUrl,
      );
    }

    // Build line items for Stripe Checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${quote.carrier?.carrierName || 'Insurance'} - ${this.formatCoverageType(quote.coverageType)}`,
            description: `Annual premium for ${this.formatCoverageType(quote.coverageType)} coverage`,
          },
          unit_amount: Math.round(Number(quote.annualPremium) * 100), // Convert to cents
        },
        quantity: 1,
      },
    ];

    try {
      // Create Stripe Checkout session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url:
          successUrl ||
          `${frontendUrl}/home/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${frontendUrl}/home/purchase/cancel`,
        metadata: {
          carrierQuoteId,
          userId,
          coverageType: quote.coverageType,
          quoteRequestId: quote.quoteRequestId,
        },
        customer_email: undefined, // Can be populated from user data
        billing_address_collection: 'auto',
      });

      this.logger.log(
        `Created Checkout session ${session.id} for quote ${carrierQuoteId}`,
      );

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create Checkout session: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to create payment session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a simulated checkout session for testing without Stripe
   */
  private async createSimulatedCheckoutSession(
    carrierQuoteId: string,
    userId: string,
    quote: CarrierQuote,
    successUrl?: string,
    cancelUrl?: string,
    frontendUrl?: string,
  ): Promise<CheckoutSessionResponseDto> {
    const simulatedSessionId = `sim_${randomUUID()}`;

    this.logger.log(
      `Created simulated Checkout session ${simulatedSessionId} for quote ${carrierQuoteId}`,
    );

    // In simulation mode, automatically complete the payment
    // Schedule the simulated payment completion
    setTimeout(async () => {
      await this.handleSimulatedPaymentComplete(
        simulatedSessionId,
        carrierQuoteId,
        userId,
        quote,
      );
    }, 100); // Small delay to simulate async processing

    const baseUrl = frontendUrl || 'http://localhost:3002';
    const checkoutUrl =
      successUrl ||
      `${baseUrl}/home/purchase/success?session_id=${simulatedSessionId}`;

    return {
      sessionId: simulatedSessionId,
      checkoutUrl,
    };
  }

  /**
   * Handle simulated payment completion
   */
  private async handleSimulatedPaymentComplete(
    sessionId: string,
    carrierQuoteId: string,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    quote: CarrierQuote,
  ): Promise<void> {
    this.logger.log(`Simulated payment completed for session ${sessionId}`);

    try {
      const bindPolicyDto: BindPolicyDto = {
        carrierQuoteId,
        paymentPlan: PaymentPlan.ANNUAL,
        autoRenewal: true,
        paymentMethodId: `sim_pm_${Date.now()}`,
        additionalNotes: `Simulated payment completed. Session: ${sessionId}`,
      };

      const { policy } = await this.policiesService.bindPolicy(
        bindPolicyDto,
        userId,
      );

      this.logger.log(
        `Policy ${policy.policyNumber} bound successfully via simulation for quote ${carrierQuoteId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to bind policy in simulation for quote ${carrierQuoteId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    // In simulation mode, webhooks are not used
    if (this.simulatePayments) {
      this.logger.log('Webhook received in simulation mode - acknowledging');
      return { received: true };
    }

    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not configured');
      return { received: false };
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error(
        `Webhook signature verification failed: ${error.message}`,
      );
      throw new HttpException(
        'Invalid webhook signature',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        this.logger.log(`Checkout session ${session.id} expired`);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        this.logger.error(
          `Payment failed for ${paymentIntent.id}: ${paymentIntent.last_payment_error?.message}`,
        );
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle successful checkout completion
   * Automatically binds the policy after payment is confirmed
   */
  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    this.logger.log(`Payment completed for session ${session.id}`);

    const { carrierQuoteId, userId } = session.metadata || {};

    if (!carrierQuoteId || !userId) {
      this.logger.error('Missing metadata in checkout session');
      return;
    }

    try {
      // Create the bind policy DTO
      const bindPolicyDto: BindPolicyDto = {
        carrierQuoteId,
        paymentPlan: PaymentPlan.ANNUAL, // Default to annual payment
        autoRenewal: true,
        paymentMethodId: session.payment_intent?.toString() || undefined,
        additionalNotes: `Payment completed via Stripe Checkout. Session: ${session.id}`,
      };

      // Bind the policy
      const { policy } = await this.policiesService.bindPolicy(
        bindPolicyDto,
        userId,
      );

      this.logger.log(
        `Policy ${policy.policyNumber} bound successfully for quote ${carrierQuoteId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to bind policy for quote ${carrierQuoteId}: ${error.message}`,
        error.stack,
      );
      // Note: In production, you would want to handle this error by:
      // 1. Sending an alert to support
      // 2. Potentially refunding the payment
      // 3. Notifying the customer
    }
  }

  /**
   * Get a checkout session by ID
   */
  async getCheckoutSession(
    sessionId: string,
  ): Promise<Stripe.Checkout.Session | SimulatedCheckoutSession> {
    // Handle simulated sessions
    if (sessionId.startsWith('sim_')) {
      return this.getSimulatedCheckoutSession(sessionId);
    }

    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve session ${sessionId}: ${error.message}`,
      );
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Get a simulated checkout session
   */
  private getSimulatedCheckoutSession(
    sessionId: string,
  ): SimulatedCheckoutSession {
    return {
      id: sessionId,
      object: 'checkout.session',
      payment_status: 'paid',
      status: 'complete',
      mode: 'payment',
      success_url: '',
      cancel_url: '',
      created: Math.floor(Date.now() / 1000),
      currency: 'usd',
      livemode: false,
      metadata: {},
      amount_total: 0,
      amount_subtotal: 0,
    };
  }

  /**
   * Format coverage type for display
   */
  private formatCoverageType(coverageType: string): string {
    return coverageType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
