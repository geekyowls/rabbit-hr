import { Module } from '@nestjs/common';
import { EmailTemplateModule } from '@modules/email-template/email-template.module';
import { OfferController } from './offer.controller';
import { OfferLetterService } from './usecases/offer-letter.service';
import { ListOffers } from './usecases/list-offers/list-offers.usecase';
import { CreateOffer } from './usecases/create-offer/create-offer.usecase';
import { GetOffer } from './usecases/get-offer/get-offer.usecase';
import { UpdateOffer } from './usecases/update-offer/update-offer.usecase';
import { SubmitOffer } from './usecases/submit-offer/submit-offer.usecase';
import { DecideOffer } from './usecases/decide-offer/decide-offer.usecase';
import { SendOffer } from './usecases/send-offer/send-offer.usecase';
import { RespondOffer } from './usecases/respond-offer/respond-offer.usecase';
import { WithdrawOffer } from './usecases/withdraw-offer/withdraw-offer.usecase';
import { DeleteOffer } from './usecases/delete-offer/delete-offer.usecase';

const USE_CASES = [
  ListOffers,
  CreateOffer,
  GetOffer,
  UpdateOffer,
  SubmitOffer,
  DecideOffer,
  SendOffer,
  RespondOffer,
  WithdrawOffer,
  DeleteOffer,
];

@Module({
  imports: [EmailTemplateModule],
  controllers: [OfferController],
  providers: [...USE_CASES, OfferLetterService],
})
export class OfferModule {}
