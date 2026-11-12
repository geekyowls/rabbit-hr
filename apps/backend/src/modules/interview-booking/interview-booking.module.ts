import { Module } from '@nestjs/common';
import { EmailTemplateModule } from '@modules/email-template/email-template.module';
import { InterviewModule } from '@modules/interview/interview.module';
import { AvailabilityController } from './availability.controller';
import { BookingLinkController } from './booking-link.controller';
import { PublicBookingController } from './public-booking.controller';
import { InterviewerAvailabilityService } from './services/interviewer-availability.service';
import { BookingLinkService } from './services/booking-link.service';
import { BookingSlotFinder } from './services/booking-slot-finder.service';
import { GetMyAvailability } from './usecases/get-my-availability/get-my-availability.usecase';
import { UpdateMyAvailability } from './usecases/update-my-availability/update-my-availability.usecase';
import { ListMyTimeOff } from './usecases/list-my-time-off/list-my-time-off.usecase';
import { CreateMyTimeOff } from './usecases/create-my-time-off/create-my-time-off.usecase';
import { UpdateMyTimeOff } from './usecases/update-my-time-off/update-my-time-off.usecase';
import { DeleteMyTimeOff } from './usecases/delete-my-time-off/delete-my-time-off.usecase';
import { CreateBookingLink } from './usecases/create-booking-link/create-booking-link.usecase';
import { ListBookingLinks } from './usecases/list-booking-links/list-booking-links.usecase';
import { CancelBookingLink } from './usecases/cancel-booking-link/cancel-booking-link.usecase';
import { GetPublicBooking } from './usecases/get-public-booking/get-public-booking.usecase';
import { ListPublicBookingSlots } from './usecases/list-public-booking-slots/list-public-booking-slots.usecase';
import { BookPublicSlot } from './usecases/book-public-slot/book-public-slot.usecase';
import { CancelPublicBooking } from './usecases/cancel-public-booking/cancel-public-booking.usecase';

const USE_CASES = [
  GetMyAvailability,
  UpdateMyAvailability,
  ListMyTimeOff,
  CreateMyTimeOff,
  UpdateMyTimeOff,
  DeleteMyTimeOff,
  CreateBookingLink,
  ListBookingLinks,
  CancelBookingLink,
  GetPublicBooking,
  ListPublicBookingSlots,
  BookPublicSlot,
  CancelPublicBooking,
];

@Module({
  imports: [EmailTemplateModule, InterviewModule],
  controllers: [
    AvailabilityController,
    BookingLinkController,
    PublicBookingController,
  ],
  providers: [
    ...USE_CASES,
    InterviewerAvailabilityService,
    BookingLinkService,
    BookingSlotFinder,
  ],
})
export class InterviewBookingModule {}
